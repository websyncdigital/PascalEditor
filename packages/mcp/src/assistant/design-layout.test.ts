import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { MATERIAL_CATALOG } from '@pascal-app/core'
import { DoorNode, ItemNode } from '@pascal-app/core/schema'
import { SceneBridge } from '../bridge/scene-bridge'
import { SqliteSceneStore } from '../storage/sqlite-scene-store'
import type { SceneStore } from '../storage/types'
import { findCatalogItem } from '../tools/asset-catalog'
import {
  collectDoorKeepouts,
  findBlockedDoors,
  itemNodePlanAabb,
  itemPlanAabb,
} from '../tools/door-clearance'
import { findItemItemCollisions } from '../tools/layout-clearance'
import type { AssistantOperation } from './contracts'
import { designRequestSchema } from './design-contracts'
import { planRoomDesign } from './design-layout'
import { DESIGN_PRESETS } from './design-presets'
import { parseDesignRequest } from './design-request'
import { checkCirculation, insideRoom } from './design-spatial'
import { mockPlanner } from './mock-planner'
import { callOperation, graphHash, withSceneTools } from './runtime'
import { InteriorAssistantService } from './service'

const cleanup: Array<() => Promise<void>> = []
afterEach(async () => {
  for (const dispose of cleanup.splice(0)) await dispose()
})
const rectangle = (width: number, depth: number): number[][] => [
  [0, 0],
  [width, 0],
  [width, depth],
  [0, depth],
]

async function fixture(name = 'Living room', polygon = rectangle(6, 5)) {
  const directory = await mkdtemp(join(tmpdir(), 'pascal-stage5-test-'))
  const databasePath = join(directory, 'pascal.db')
  const store = new SqliteSceneStore({ databasePath })
  cleanup.push(async () => {
    store.close()
    await rm(directory, { recursive: true, force: true })
  })
  const bridge = new SceneBridge()
  bridge.setScene({}, [])
  bridge.loadDefault()
  const level = Object.values(bridge.getNodes()).find((node) => node.type === 'level')!
  const meta = await store.save({ name, graph: bridge.exportJSON() })
  async function perform(operation: AssistantOperation) {
    const scene = (await store.load(meta.id))!
    return withSceneTools(store, scene, (client) => callOperation(client, operation, scene.version))
  }
  await perform({ tool: 'create_room', args: { levelId: level.id, name, polygon } })
  const scene = (await store.load(meta.id))!
  const room = Object.values(scene.graph.nodes).find((node) => node.type === 'zone')!
  const service = new InteriorAssistantService(store)
  const propose = async (prompt: string, targetService = service) => {
    const current = (await store.load(meta.id))!
    return targetService.propose(
      'owner',
      meta.id,
      current.version,
      prompt,
      [],
      mockPlanner,
      new AbortController().signal,
    )
  }
  return { store, databasePath, scene, room, level, perform, service, propose }
}

describe('automated room designs', () => {
  test.each([
    {
      name: 'A small living room',
      polygon: rectangle(5, 4),
      purpose: 'living' as const,
      style: 'scandinavian' as const,
    },
    {
      name: 'B medium bedroom',
      polygon: rectangle(5, 4.5),
      purpose: 'bedroom' as const,
      style: 'modern-minimalist' as const,
    },
    {
      name: 'E irregular living room',
      polygon: [
        [0, 0],
        [7, 0],
        [7, 3],
        [4, 3],
        [4, 6],
        [0, 6],
      ],
      purpose: 'living' as const,
      style: 'contemporary' as const,
    },
  ])('$name: deterministic valid alternatives persist through a fresh store', async ({
    name,
    polygon,
    purpose,
    style,
  }) => {
    const { store, databasePath, scene, room, service, propose } = await fixture(name, polygon)
    const request = designRequestSchema.parse({ roomId: room.id, purpose, style })
    const first = planRoomDesign(scene.graph, request)
    expect(first).toEqual(planRoomDesign(scene.graph, request))
    expect(first.alternatives.length).toBeGreaterThanOrEqual(2)
    const result = await propose(
      `Design this ${purpose === 'living' ? 'living room' : 'bedroom'} in a ${style.replace('-', ' ')} style`,
    )
    expect(result.proposal, result.message).not.toBeNull()
    expect(result.proposal!.design!.alternatives.length).toBeGreaterThanOrEqual(2)
    expect((await store.load(scene.id))!.graph).toEqual(scene.graph)
    const p = result.proposal!
    const choice = p.design!.alternatives[0]!
    const approved = await service.approve('owner', p.id, scene.id, scene.version, choice.id)
    expect(approved.status, JSON.stringify(approved.result)).toBe('succeeded')
    const saved = (await store.load(scene.id))!
    expect(saved.version).toBe(scene.version + choice.steps.length)
    const savedRoom = saved.graph.nodes[room.id]!
    expect(savedRoom.type).toBe('zone')
    if (savedRoom.type !== 'zone') throw new Error('Expected room')
    expect(savedRoom.polygon).toEqual(room.type === 'zone' ? room.polygon : [])
    expect(savedRoom.floor?.finish).toBe(`library:${DESIGN_PRESETS[style].floorMaterial}`)
    expect(savedRoom.wallMaterial).toBe(`library:${DESIGN_PRESETS[style].wallMaterial}`)
    for (const item of Object.values(saved.graph.nodes).filter((node) => node.type === 'item')) {
      expect(item.parentId).toBe(room.parentId)
      expect(findCatalogItem(item.asset.id)).toBeDefined()
      expect(insideRoom(itemNodePlanAabb(item)!, savedRoom)).toBe(true)
      if (item.asset.id === 'floor-lamp')
        expect(item.lighting).toEqual(DESIGN_PRESETS[style].lighting)
    }
    expect(
      findItemItemCollisions({
        nodes: Object.values(saved.graph.nodes),
        gap: request.itemClearance,
      }),
    ).toEqual([])
    expect(findBlockedDoors({ nodes: Object.values(saved.graph.nodes) })).toEqual([])
    const reopened = new SqliteSceneStore({ databasePath })
    try {
      expect((await reopened.load(scene.id))!.graph).toEqual(saved.graph)
    } finally {
      reopened.close()
    }
    expect(
      (await service.approve('owner', p.id, scene.id, scene.version, p.design!.alternatives[1]!.id))
        .result,
    ).toEqual(approved.result)
    expect((await store.load(scene.id))!.version).toBe(saved.version)
  })

  test('C narrow room rejects impossible furniture without persisting', async () => {
    const { scene, store, propose } = await fixture('Narrow bedroom', rectangle(1.2, 5))
    const result = await propose('Make this bedroom modern minimalist')
    expect(result.proposal).toBeNull()
    expect(result.message).toContain('cannot fit')
    expect((await store.load(scene.id))!.graph).toEqual(scene.graph)
  })

  test('D furnished room preserves a protected sofa, other rooms and metadata; a second arrangement adds no duplicates', async () => {
    const { scene, store, room, level, service, propose, perform } = await fixture()
    await perform({
      tool: 'place_floor_item',
      args: { zoneId: room.id, catalogItemId: 'sofa', position: [2, 0, 1.25], rotationY: 0 },
    })
    await perform({
      tool: 'create_room',
      args: {
        levelId: level.id,
        name: 'Other room',
        polygon: [
          [10, 0],
          [14, 0],
          [14, 4],
          [10, 4],
        ],
      },
    })
    const baseline = (await store.load(scene.id))!
    const sofa = Object.values(baseline.graph.nodes).find((node) => node.type === 'item')!
    const proposalResult = await propose(
      `Design Living room in a Scandinavian style; keep ${sofa.id}`,
    )
    const p = proposalResult.proposal!
    expect(p, proposalResult.message).not.toBeNull()
    expect(p.design!.alternatives.length).toBeGreaterThan(0)
    const result = await service.approve(
      'owner',
      p.id,
      scene.id,
      p.version,
      p.design!.alternatives[0]!.id,
    )
    expect(result.status, JSON.stringify(result.result)).toBe('succeeded')
    const saved = (await store.load(scene.id))!
    expect(saved.graph.nodes[sofa.id]).toEqual(sofa)
    for (const node of Object.values(baseline.graph.nodes).filter(
      (node) => !['item', 'level'].includes(node.type) && node.id !== room.id,
    ))
      expect(saved.graph.nodes[node.id]).toEqual(node)
    const next = (await propose(`Rearrange Living room; keep ${sofa.id}`)).proposal!
    expect(next?.design?.alternatives.length).toBeGreaterThan(0)
    expect(
      next
        .design!.alternatives.flatMap((option) => option.steps)
        .every((step) => step.operation.tool === 'edit_floor_item'),
    ).toBe(true)
    const nextResult = await service.approve(
      'owner',
      next.id,
      scene.id,
      next.version,
      next.design!.alternatives[0]!.id,
    )
    expect(nextResult.status, JSON.stringify(nextResult.result)).toBe('succeeded')
    const final = (await store.load(scene.id))!
    expect(Object.keys(final.graph.nodes)).toEqual(Object.keys(saved.graph.nodes))
    expect(final.graph.nodes[sofa.id]).toEqual(sofa)
  })

  test('door openings and room holes are excluded, locked objects remain obstacles', async () => {
    const { scene, room } = await fixture('Living room', rectangle(8, 7))
    const graph = structuredClone(scene.graph)
    const zone = graph.nodes[room.id]!
    if (zone.type !== 'zone') throw new Error('Expected room')
    zone.holes = [
      [
        [3, 2],
        [5, 2],
        [5, 4],
        [3, 4],
      ],
    ]
    const request = designRequestSchema.parse({
      roomId: room.id,
      purpose: 'living',
      style: 'scandinavian',
    })
    const wall = Object.values(graph.nodes).find((node) => node.type === 'wall')!
    const door = DoorNode.parse({
      parentId: wall.id,
      wallId: wall.id,
      position: [3, 0, 0],
      width: 1,
    })
    graph.nodes[door.id] = door
    const plan = planRoomDesign(graph, request)
    expect(plan.alternatives.length).toBeGreaterThan(0)
    for (const option of plan.alternatives)
      for (const item of option.placements) {
        const asset = findCatalogItem(item.assetId)!
        expect(
          insideRoom(itemPlanAabb(item.position, asset.dimensions, item.rotationY), zone),
        ).toBe(true)
        const hypothetical = ItemNode.parse({
          asset,
          position: item.position,
          rotation: [0, item.rotationY, 0],
          parentId: room.parentId,
        })
        expect(findBlockedDoors({ nodes: [...Object.values(graph.nodes), hypothetical] })).toEqual(
          [],
        )
      }
    const locked = structuredClone(graph)
    const sofa = ItemNode.parse({
      asset: findCatalogItem('sofa'),
      parentId: room.parentId,
      position: [1.75, 0, 5.5],
      metadata: { locked: true },
    })
    locked.nodes[sofa.id] = sofa
    const preserved = planRoomDesign(locked, request)
    expect(preserved.alternatives.length).toBeGreaterThan(0)
    expect(
      preserved.alternatives.every(
        (option) => option.placements.find((item) => item.itemId === sofa.id)?.action === 'keep',
      ),
    ).toBe(true)
    expect(collectDoorKeepouts(Object.values(graph.nodes))).toHaveLength(1)
    expect(checkCirculation(zone, [{ minX: 0, maxX: 8, minZ: 0, maxZ: 7 }], [], [], 0.6)).toContain(
      'No 0.6 m',
    )
  })

  test('ambiguity, unsupported styles, invalid IDs/clearance/support and unknown dimensions fail explicitly', async () => {
    const { scene, room, level, propose, perform, store } = await fixture()
    expect((await propose('Design a vintage living room')).proposal).toBeNull()
    expect(
      (await propose('Design a Scandinavian living room; keep missing-sofa')).proposal,
    ).toBeNull()
    expect(
      (await propose('Design a Scandinavian living room with clearance 9 m')).proposal,
    ).toBeNull()
    expect(() =>
      planRoomDesign(
        scene.graph,
        designRequestSchema.parse({
          roomId: 'zone_missing',
          purpose: 'living',
          style: 'scandinavian',
        }),
      ),
    ).toThrow('valid level parent')
    const graph = structuredClone(scene.graph)
    const zone = graph.nodes[room.id]!
    if (zone.type !== 'zone') throw new Error('Expected room')
    zone.floor = { support: 'open' }
    expect(() =>
      planRoomDesign(
        graph,
        designRequestSchema.parse({ roomId: room.id, purpose: 'living', style: 'scandinavian' }),
      ),
    ).toThrow('flat room floor')
    zone.floor = undefined
    const slab = Object.values(graph.nodes).find((node) => node.type === 'slab')!
    slab.holes = [
      [
        [1, 1],
        [2, 1],
        [2, 2],
        [1, 2],
      ],
    ]
    const validRequest = designRequestSchema.parse({
      roomId: room.id,
      purpose: 'living',
      style: 'scandinavian',
    })
    expect(() => planRoomDesign(graph, validRequest)).toThrow('floor plates')
    slab.holes = []
    slab.elevation = 0.5
    expect(() => planRoomDesign(graph, validRequest)).toThrow('floor plates')
    slab.elevation = 0.05
    const invalidItem = ItemNode.parse({
      asset: findCatalogItem('sofa'),
      parentId: room.parentId,
      position: [2, 0, 2],
    })
    invalidItem.asset.dimensions = [0, 1, 0]
    graph.nodes[invalidItem.id] = invalidItem
    expect(() =>
      planRoomDesign(
        graph,
        designRequestSchema.parse({ roomId: room.id, purpose: 'living', style: 'scandinavian' }),
      ),
    ).toThrow('footprint')
    await perform({
      tool: 'create_room',
      args: {
        levelId: level.id,
        name: 'Second living room',
        polygon: [
          [10, 0],
          [15, 0],
          [15, 5],
          [10, 5],
        ],
      },
    })
    const current = (await store.load(scene.id))!
    expect(
      parseDesignRequest('Show me three alternative layouts', current.graph, []),
    ).toHaveProperty('message')
  })

  test('approval requires a selected alternative, rejects stale scenes, and cancellation does not save', async () => {
    const { scene, store, service, propose } = await fixture()
    const proposalResult = await propose('Design a Scandinavian living room')
    const p = proposalResult.proposal!
    expect(p, proposalResult.message).not.toBeNull()
    await expect(service.approve('owner', p.id, scene.id, p.version)).rejects.toThrow('Select one')
    await expect(service.approve('other', p.id, scene.id, p.version, 'layout-1')).rejects.toThrow(
      'unavailable',
    )
    expect((await store.load(scene.id))!.version).toBe(scene.version)
    service.cancel('owner', p.id)
    expect((await service.approve('owner', p.id, scene.id, p.version, 'layout-1')).status).toBe(
      'cancelled',
    )
    const second = (await propose('Design a Scandinavian living room')).proposal!
    await store.save({
      id: scene.id,
      name: scene.name,
      graph: scene.graph,
      expectedVersion: scene.version,
    })
    expect(
      (await service.approve('owner', second.id, scene.id, second.version, 'layout-1')).status,
    ).toBe('conflict')
    expect((await store.load(scene.id))!.graph).toEqual(scene.graph)
  })

  test('a failed second save reports partial completion, preserves the first, and never replays approval', async () => {
    const { scene, store, propose } = await fixture()
    let writes = 0
    const wrapper = new Proxy(store, {
      get(target, key) {
        if (key === 'save')
          return async (options: Parameters<SceneStore['save']>[0]) => {
            if (++writes === 2) throw new Error('Injected save failure')
            return store.save(options)
          }
        const value = Reflect.get(target, key)
        return typeof value === 'function' ? value.bind(target) : value
      },
    }) as SceneStore
    const service = new InteriorAssistantService(wrapper)
    const proposalResult = await propose('Design a Scandinavian living room', service)
    const p = proposalResult.proposal!
    expect(p, proposalResult.message).not.toBeNull()
    const result = await service.approve('owner', p.id, scene.id, p.version, 'layout-1')
    expect(result.status).toBe('partial')
    expect(result.result?.completedSteps).toBe(1)
    const saved = (await store.load(scene.id))!
    expect(saved.version).toBe(scene.version + 1)
    expect(Object.values(saved.graph.nodes).filter((node) => node.type === 'item')).toHaveLength(1)
    await service.approve('owner', p.id, scene.id, p.version, 'layout-2')
    expect((await store.load(scene.id))!.graph).toEqual(saved.graph)
    expect(writes).toBe(2)
  })

  test.each([
    'cancel',
    'manual-edit',
    'event-failure',
  ])('stops a multi-operation design after %s without overwriting intervening data', async (reason) => {
    const { scene, store, room, propose } = await fixture()
    let service: InteriorAssistantService
    let proposalId = ''
    let events = 0
    let manualName = ''
    const wrapper = new Proxy(store, {
      get(target, key) {
        if (key === 'appendSceneEvent')
          return async (event: Parameters<NonNullable<SceneStore['appendSceneEvent']>>[0]) => {
            const result = await store.appendSceneEvent(event)
            if (++events === 1) {
              if (reason === 'cancel') service.cancel('owner', proposalId)
              if (reason === 'event-failure') throw new Error('Injected event publication failure')
              if (reason === 'manual-edit') {
                const current = (await store.load(scene.id))!
                const graph = structuredClone(current.graph)
                manualName = 'Intervening manual room name'
                graph.nodes[room.id]!.name = manualName
                await store.save({
                  id: scene.id,
                  name: scene.name,
                  graph,
                  expectedVersion: current.version,
                })
              }
            }
            return result
          }
        const value = Reflect.get(target, key)
        return typeof value === 'function' ? value.bind(target) : value
      },
    }) as SceneStore
    service = new InteriorAssistantService(wrapper)
    const p = (await propose('Design a Scandinavian living room', service)).proposal!
    proposalId = p.id
    const result = await service.approve('owner', p.id, scene.id, p.version, 'layout-1')
    expect(['partial', 'uncertain']).toContain(result.status)
    expect(events).toBe(1)
    const saved = (await store.load(scene.id))!
    expect(Object.values(saved.graph.nodes).filter((node) => node.type === 'item')).toHaveLength(1)
    expect(result.result?.version).toBe(saved.version)
    expect(result.result?.graphHash).toBe(graphHash(saved.graph))
    if (manualName) expect(saved.graph.nodes[room.id]!.name).toBe(manualName)
    await service.approve('owner', p.id, scene.id, p.version, 'layout-2')
    expect((await store.load(scene.id))!.graph).toEqual(saved.graph)
  })

  test('preserving wall finishes and requesting wider walking clearance are explicit options', async () => {
    const { scene, propose } = await fixture()
    const p = (
      await propose('Design my living room in a Scandinavian style without changing the walls')
    ).proposal!
    expect(p.design!.request.preserveWalls).toBe(true)
    expect(
      p.design!.alternatives.every((option) =>
        option.steps.every(
          ({ operation }) =>
            operation.tool !== 'set_room_finish' || operation.args.surface !== 'wall',
        ),
      ),
    ).toBe(true)
    const parsed = parseDesignRequest(
      'Arrange the furniture to create more walking space',
      scene.graph,
      [],
    )!
    expect('request' in parsed && parsed.request.itemClearance).toBe(0.8)
  })

  test('mapped catalog models and finish texture files exist; no invented style variants', async () => {
    const publicRoot = resolve(import.meta.dir, '../../../../apps/editor/public')
    for (const preset of Object.values(DESIGN_PRESETS)) {
      for (const id of new Set([...preset.living.flat(), ...preset.bedroom.flat()])) {
        const asset = findCatalogItem(id)!
        expect(asset).toBeDefined()
        const path = join(publicRoot, asset.src)
        expect((await stat(path)).size).toBeGreaterThan(12)
        expect((await readFile(path)).subarray(0, 4).toString()).toBe('glTF')
      }
      for (const id of [preset.floorMaterial, preset.wallMaterial]) {
        const material = MATERIAL_CATALOG.find((entry) => entry.id === id)!
        expect(material).toBeDefined()
        for (const url of Object.values(material.preset.maps ?? {}))
          if (url) expect((await stat(join(publicRoot, url))).size).toBeGreaterThan(0)
      }
    }
    const { scene, propose } = await fixture()
    const p = (await propose('Use a light oak floor and warm lighting')).proposal!
    expect(p.design!.alternatives[0]!.warnings.join(' ')).toContain(
      'oak/wood flooring is unavailable',
    )
    expect(graphHash(scene.graph)).toHaveLength(64)
  })
})
