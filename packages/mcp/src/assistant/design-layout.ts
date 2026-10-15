import type { SceneGraph } from '@pascal-app/core/clone-scene-graph'
import type { AnyNodeId, ItemNode } from '@pascal-app/core/schema'
import { findCatalogItem } from '../tools/asset-catalog'
import {
  collectDoorKeepouts,
  inspectItemPlanFootprint,
  itemPlanAabb,
  type PlanAabb,
} from '../tools/door-clearance'
import { polygonBounds } from '../tools/geometry'
import { aabbsOverlap } from '../tools/layout-clearance'
import type { DesignAlternative, DesignRequest, DesignStep } from './design-contracts'
import { designRequestSchema } from './design-contracts'
import { DESIGN_PRESETS } from './design-presets'
import { checkCirculation, insideRoom } from './design-spatial'

const expand = (b: PlanAabb, gap: number): PlanAabb => ({
  minX: b.minX - gap,
  maxX: b.maxX + gap,
  minZ: b.minZ - gap,
  maxZ: b.maxZ + gap,
})

export function planRoomDesign(
  graph: SceneGraph,
  input: DesignRequest,
): {
  alternatives: DesignAlternative[]
  rejectedAlternatives: string[]
  roomName: string
} {
  const request = designRequestSchema.parse(input)
  const room = graph.nodes[request.roomId as AnyNodeId]
  if (
    room?.type !== 'zone' ||
    room.spaceRole !== 'room' ||
    !room.parentId ||
    graph.nodes[room.parentId as AnyNodeId]?.type !== 'level'
  )
    throw new Error('A room with a valid level parent is required.')
  if (
    room.hasFloor === false ||
    room.floor?.support === 'open' ||
    (room.floor?.elevation ?? 0) !== 0 ||
    room.floor?.sourceSlabId
  )
    throw new Error(
      'Automated layouts currently require an ordinary flat room floor; stepped or hosted floors need manual design.',
    )
  if (
    room.polygon.length < 3 ||
    room.polygon.length > 64 ||
    room.holes.some((hole) => hole.length > 64)
  )
    throw new Error('Room geometry exceeds the supported polygon limits.')
  const bounds = polygonBounds(room.polygon)
  if (
    ![bounds.width, bounds.depth, bounds.minX, bounds.minZ].every(Number.isFinite) ||
    bounds.width > 30 ||
    bounds.depth > 30
  )
    throw new Error('Automated layouts support finite rooms up to 30 metres on either axis.')
  const nodes = Object.values(graph.nodes)
  const levelNodes = nodes.filter((node) => node.parentId === room.parentId)
  if (
    levelNodes.some(
      (node) =>
        node.type === 'slab' &&
        (node.boundary !== 'auto' ||
          node.plateRole !== 'base' ||
          node.recessed ||
          node.support === 'open' ||
          node.holes.length > 0 ||
          node.elevation !== 0.05 ||
          (node.floorHeight !== undefined && node.floorHeight !== 0.05) ||
          (node.referenceFloorElevation !== undefined && node.referenceFloorElevation !== 0.05)),
    )
  )
    throw new Error(
      'Authored, elevated or cut-out floor plates need manual layout validation in this version.',
    )
  const walls = levelNodes.filter((node) => node.type === 'wall')
  if (walls.some((wall) => wall.curveOffset))
    throw new Error('Curved walls require manual layout validation in this version.')
  const unknown = levelNodes.filter(
    (node) => !['wall', 'zone', 'slab', 'ceiling', 'item', 'separator'].includes(node.type),
  )
  if (unknown.length)
    throw new Error(
      `Unmodelled obstacles on this level need manual review: ${[...new Set(unknown.map((node) => node.type))].join(', ')}.`,
    )
  const items = levelNodes.filter((node) => node.type === 'item')
  const footprints = new Map<string, PlanAabb>()
  for (const item of items) {
    const footprint = inspectItemPlanFootprint(item, { floorOnly: true })
    if (!footprint.ok)
      throw new Error(
        `Cannot validate the footprint of ${item.name ?? item.id}: ${footprint.reason}.`,
      )
    footprints.set(item.id, footprint.aabb)
  }
  const protectedIds = new Set(request.protectedIds)
  for (const id of protectedIds)
    if (!items.some((item) => item.id === id))
      throw new Error(`Protected item is not on this room's level: ${id}.`)
  const inRoom = items
    .filter((item) => insideRoom(footprints.get(item.id)!, room))
    .sort((a, b) => a.id.localeCompare(b.id))
  for (const item of items)
    if (
      item.metadata?.locked === true ||
      item.metadata?.designLocked === true ||
      item.supportSlabId ||
      item.children.length
    )
      protectedIds.add(item.id)
  const preset = DESIGN_PRESETS[request.style]
  const doors = collectDoorKeepouts(nodes, {
    levelId: room.parentId,
    clearDepth: request.doorClearDepth,
  })
  const wallPad = Math.max(
    request.wallClearance,
    ...walls.map((wall) => (wall.thickness ?? 0.1) / 2 + 0.05),
  )
  const wallBoxes = walls.map((wall) =>
    expand(
      {
        minX: Math.min(wall.start[0], wall.end[0]),
        maxX: Math.max(wall.start[0], wall.end[0]),
        minZ: Math.min(wall.start[1], wall.end[1]),
        maxZ: Math.max(wall.start[1], wall.end[1]),
      },
      (wall.thickness ?? 0.1) / 2,
    ),
  )
  const warnings = [
    'Style tags are design preferences: this small catalog has no verified style-specific furniture variants.',
    'Clearance and circulation use conservative plan boxes and a sampling grid. They do not certify accessibility, building regulations, ergonomics, or access to a specific furniture face.',
  ]
  if (request.style === 'scandinavian' || request.requestedOak)
    warnings.push(
      'Verified oak/wood flooring is unavailable. The proposal offers the listed supported light concrete finish; approve only if this substitute is acceptable.',
    )
  if (items.some((item) => item.supportSlabId || item.children.length))
    warnings.push('Items with pinned supports or attached children are preserved.')
  const alternatives: DesignAlternative[] = []
  const rejectedAlternatives: string[] = []
  const signatures = new Set<string>()
  for (let variant = 0; variant < request.alternatives; variant++) {
    const occupied = new Map(footprints)
    const steps: DesignStep[] = []
    const placements: DesignAlternative['placements'] = []
    const rejected: Record<string, number> = {}
    const localWarnings = [...warnings]
    const targets: Array<{ assetId: string; item?: ItemNode; required: boolean }> = []
    if (request.mode !== 'finishes') {
      for (const item of inRoom) targets.push({ assetId: item.asset.id, item, required: true })
      if (request.mode === 'design') {
        for (const [index, choices] of preset[request.purpose].entries()) {
          if (inRoom.some((item) => (choices as readonly string[]).includes(item.asset.id)))
            continue
          const assetId = choices.find((id) => Boolean(findCatalogItem(id)))
          if (!assetId) throw new Error(`No compatible catalog asset for ${choices.join(' or ')}.`)
          targets.push({ assetId, required: index === 0 || assetId === 'floor-lamp' })
        }
      }
    }
    if (targets.length > 10)
      throw new Error('Design one room with at most ten furniture items per request.')
    // Optional pieces must not consume the space needed by a required bed, sofa or light.
    targets.sort((a, b) => Number(b.required) - Number(a.required))
    let failure = ''
    for (const [index, target] of targets.entries()) {
      const { item, assetId } = target
      const asset = item?.asset ?? findCatalogItem(assetId)
      if (!asset?.dimensions || asset.attachTo) {
        failure = `Unsupported floor asset: ${assetId}.`
        break
      }
      if (item && protectedIds.has(item.id)) {
        placements.push({
          itemId: item.id,
          assetId,
          name: item.name ?? asset.name,
          position: [...item.position],
          rotationY: item.rotation[1],
          action: 'keep',
        })
        continue
      }
      const dimensions = item ? inspectItemPlanFootprint(item) : null
      if (dimensions && !dimensions.ok) {
        failure = `Invalid dimensions for ${assetId}.`
        break
      }
      const size = dimensions?.ok ? dimensions.effectiveDimensions : asset.dimensions
      const angles = [(variant * Math.PI) / 2, 0, Math.PI / 2, Math.PI, -Math.PI / 2].filter(
        (a, i, all) => all.indexOf(a) === i,
      )
      const anchors = [
        [bounds.centerX, bounds.maxZ],
        [bounds.minX, bounds.centerZ],
        [bounds.centerX, bounds.minZ],
      ]
      const anchor =
        assetId === 'coffee-table'
          ? [bounds.centerX, bounds.centerZ]
          : anchors[(variant + (index > 1 ? index : 0)) % 3]!
      const candidates: Array<{
        position: [number, number, number]
        rotationY: number
        distance: number
      }> = []
      const gridStep = Math.max(0.25, Math.max(bounds.width, bounds.depth) / 48)
      for (const [angleIndex, rotationY] of angles.entries()) {
        for (let x = bounds.minX + gridStep; x < bounds.maxX; x += gridStep) {
          for (let z = bounds.minZ + gridStep; z < bounds.maxZ; z += gridStep) {
            candidates.push({
              position: [Number(x.toFixed(6)), item?.position[1] ?? 0, Number(z.toFixed(6))],
              rotationY,
              distance: Math.hypot(x - anchor[0]!, z - anchor[1]!) + angleIndex * 0.03,
            })
          }
        }
      }
      candidates.sort(
        (a, b) =>
          a.distance - b.distance ||
          a.position[0] - b.position[0] ||
          a.position[2] - b.position[2] ||
          a.rotationY - b.rotationY,
      )
      const candidate = candidates.find(({ position, rotationY }) => {
        const box = itemPlanAabb(position, size, rotationY)
        const reason = !insideRoom(expand(box, wallPad), room)
          ? 'outside_room_or_hole'
          : wallBoxes.some((wall) => aabbsOverlap(box, wall, 0.05))
            ? 'wall_intersection'
            : doors.some((door) => aabbsOverlap(box, door.aabb, 0.02))
              ? 'door_clearance'
              : [...occupied].some(
                    ([id, other]) =>
                      id !== item?.id && aabbsOverlap(box, other, request.itemClearance),
                  )
                ? 'furniture_clearance'
                : null
        if (reason) {
          rejected[reason] = (rejected[reason] ?? 0) + 1
          return false
        }
        return (
          !item ||
          JSON.stringify(position) !== JSON.stringify(item.position) ||
          rotationY !== item.rotation[1]
        )
      })
      if (!candidate) {
        if (item) {
          placements.push({
            itemId: item.id,
            assetId,
            name: item.name ?? asset.name,
            position: [...item.position],
            rotationY: item.rotation[1],
            action: 'keep',
          })
          localWarnings.push(
            `${item.name ?? item.id} stays in place: no valid sequential move found.`,
          )
          continue
        }
        if (target.required) {
          failure = `${asset.name} cannot fit with the requested clearances and existing objects.`
          break
        }
        localWarnings.push(`${asset.name} omitted: no valid placement.`)
        continue
      }
      const stepIndex = steps.length
      steps.push({
        operation: item
          ? {
              tool: 'edit_floor_item',
              args: {
                itemId: item.id,
                zoneId: room.id,
                position: candidate.position,
                rotationY: candidate.rotationY,
              },
            }
          : {
              tool: 'place_floor_item',
              args: {
                catalogItemId: assetId,
                zoneId: room.id,
                position: candidate.position,
                rotationY: candidate.rotationY,
              },
            },
      })
      occupied.set(
        item?.id ?? `new:${stepIndex}`,
        itemPlanAabb(candidate.position, size, candidate.rotationY),
      )
      placements.push({
        itemId: item?.id,
        assetId,
        name: item?.name ?? asset.name,
        position: candidate.position,
        rotationY: candidate.rotationY,
        action: item ? 'move' : 'add',
      })
      if (
        request.mode === 'design' &&
        asset.interactive?.effects?.some((effect) => effect.kind === 'light') &&
        JSON.stringify(item?.lighting) !== JSON.stringify(preset.lighting)
      ) {
        steps.push({
          operation: {
            tool: 'configure_item_light',
            args: { itemId: item?.id ?? `new:${stepIndex}`, ...preset.lighting },
          },
          ...(item ? {} : { itemFromStep: stepIndex }),
        })
      }
    }
    const relevant = new Set([
      ...inRoom.map((item) => item.id),
      ...[...occupied.keys()].filter((id) => id.startsWith('new:')),
    ])
    for (const id of relevant) {
      const box = occupied.get(id)!
      if (
        !insideRoom(expand(box, wallPad), room) ||
        wallBoxes.some((wall) => aabbsOverlap(box, wall, 0.05)) ||
        doors.some((door) => aabbsOverlap(box, door.aabb, 0.02)) ||
        [...occupied].some(
          ([otherId, other]) => otherId !== id && aabbsOverlap(box, other, request.itemClearance),
        )
      ) {
        failure ||=
          'The final arrangement cannot satisfy the requested boundary, door or furniture clearances while preserving existing objects.'
      }
    }
    if (!failure && request.mode !== 'finishes')
      failure =
        checkCirculation(
          room,
          [...occupied.values(), ...wallBoxes],
          [...relevant].map((id) => occupied.get(id)!),
          doors.map((door) => door.aabb),
          request.itemClearance,
        ) ?? ''
    const finishes: DesignAlternative['finishes'] = {}
    if (!failure && request.mode !== 'rearrange') {
      for (const surface of ['floor', 'wall'] as const) {
        if (surface === 'wall' && request.preserveWalls) continue
        const material = surface === 'floor' ? preset.floorMaterial : preset.wallMaterial
        finishes[surface] = material
        if (
          (surface === 'floor' ? room.floor?.finish : room.wallMaterial) !== `library:${material}`
        )
          steps.push({
            operation: {
              tool: 'set_room_finish',
              args: { zoneId: room.id, surface, catalogMaterialId: material },
            },
          })
      }
      if (request.mode === 'finishes') {
        for (const item of inRoom.filter(
          (item) =>
            !protectedIds.has(item.id) &&
            item.asset.interactive?.effects.some((effect) => effect.kind === 'light'),
        )) {
          if (JSON.stringify(item.lighting) !== JSON.stringify(preset.lighting))
            steps.push({
              operation: {
                tool: 'configure_item_light',
                args: { itemId: item.id, ...preset.lighting },
              },
            })
        }
        if (
          !inRoom.some((item) =>
            item.asset.interactive?.effects.some((effect) => effect.kind === 'light'),
          )
        )
          localWarnings.push(
            'No existing supported lamp in this room. Use a full design request to insert real lighting.',
          )
      }
    }
    if (!steps.length && !failure)
      failure =
        'No supported change is available; preserved objects and finishes already meet this proposal.'
    if (steps.length > 16) failure = 'The proposal exceeds the sixteen-operation limit.'
    if (failure) {
      rejectedAlternatives.push(`Alternative ${variant + 1}: ${failure}`)
      continue
    }
    const signature = JSON.stringify(steps)
    if (signatures.has(signature)) {
      rejectedAlternatives.push(
        `Alternative ${variant + 1}: identical to an earlier valid arrangement.`,
      )
      continue
    }
    signatures.add(signature)
    alternatives.push({
      id: `layout-${variant + 1}`,
      title: `${preset.name} · ${['back-wall focus', 'side-wall focus', 'opposite-wall focus'][variant]}`,
      explanation: `${preset.layoutPreference}. ${request.mode === 'rearrange' ? 'Existing furniture only; finishes and lighting are preserved.' : 'Reuse existing furniture and add only missing functional pieces.'}`,
      steps,
      placements,
      finishes,
      ...(request.mode !== 'rearrange' ? { lighting: { ...preset.lighting } } : {}),
      warnings: localWarnings,
      rejectedPlacements: rejected,
      validation: [
        `Plan footprints contained in room; ${request.itemClearance} m furniture gap, ${wallPad} m wall margin, ${request.doorClearDepth} m door keep-out depth.`,
        'Positions use level-local metres; Y rotations use radians. Preserved objects are obstacles.',
      ],
    })
  }
  return { alternatives, rejectedAlternatives, roomName: room.name }
}
