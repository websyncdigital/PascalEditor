import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { getRenderableSlabPolygon, polygonsIntersect, polygonsOverlap } from '@pascal-app/core'
import type {
  AnyNodeId,
  ItemNode as ItemNodeType,
  SlabNode,
  WallNode,
} from '@pascal-app/core/schema'
import { ItemNode } from '@pascal-app/core/schema'
import { z } from 'zod'
import type { SceneOperations } from '../operations'
import { ADDITIVE_TOOL_ANNOTATIONS, DESTRUCTIVE_TOOL_ANNOTATIONS } from './annotations'
import { findCatalogItem } from './asset-catalog'
import { findBlockedDoors, itemNodePlanAabb } from './door-clearance'
import { ErrorCode, throwMcpError } from './errors'
import { pointInPolygon } from './geometry'
import { findItemItemCollisions } from './layout-clearance'
import {
  assertLiveSceneCurrent,
  liveSyncOutput,
  persistencePayload,
  publishLiveSceneSnapshot,
} from './live-sync'
import { measurement } from './measurement'
import { NodeIdSchema } from './schemas'

const coordinate = measurement('length', 'm')
const positionSchema = z.array(coordinate).length(3)
const rotationSchema = measurement('angle', 'rad')
const expectedVersionSchema = z.number().int().positive()

async function assertWritableScene(
  bridge: SceneOperations,
  expectedVersion: number,
): Promise<void> {
  await assertLiveSceneCurrent(bridge, expectedVersion)
  if (!bridge.canAppendSceneEvents) {
    throwMcpError(ErrorCode.InvalidRequest, 'Saved-scene event publication is unavailable')
  }
}

function floorItem(bridge: SceneOperations, id: string, allowSlabSupport = false): ItemNodeType {
  const node = bridge.getNode(id as AnyNodeId)
  if (node?.type !== 'item' || node.asset.attachTo) {
    throwMcpError(ErrorCode.InvalidParams, `Floor furniture item not found: ${id}`)
  }
  const parent = node.parentId ? bridge.getNode(node.parentId as AnyNodeId) : null
  if (parent?.type !== 'level' || (node.supportSlabId && !allowSlabSupport)) {
    throwMcpError(
      ErrorCode.InvalidRequest,
      `Item ${id} has an unsupported parent or pinned support`,
    )
  }
  return node
}

function floorFootprint(item: ItemNodeType): Array<[number, number]> {
  const aabb = itemNodePlanAabb(item)
  if (!aabb) throwMcpError(ErrorCode.InvalidParams, 'Item has no valid plan footprint')
  return [
    [aabb.minX, aabb.minZ],
    [aabb.maxX, aabb.minZ],
    [aabb.maxX, aabb.maxZ],
    [aabb.minX, aabb.maxZ],
  ]
}

function validateSlabSupport(bridge: SceneOperations, item: ItemNodeType): void {
  if (!item.supportSlabId) return
  const slab = bridge.getNode(item.supportSlabId as AnyNodeId)
  if (slab?.type !== 'slab' || slab.parentId !== item.parentId) {
    throwMcpError(ErrorCode.InvalidRequest, `Item ${item.id} requires a slab support on its level`)
  }
  const nodes = Object.values(bridge.getNodes())
  const polygon = getRenderableSlabPolygon(slab, {
    walls: nodes.filter(
      (node): node is WallNode => node.type === 'wall' && node.parentId === item.parentId,
    ),
    siblingSlabs: nodes.filter(
      (node): node is SlabNode =>
        node.type === 'slab' && node.parentId === item.parentId && node.id !== slab.id,
    ),
  })
  const corners = floorFootprint(item)
  // Refuse support transitions instead of silently electing a different floor height.
  if (
    !corners.every((corner) => pointInPolygon(corner, polygon)) ||
    polygonsIntersect(corners, polygon) ||
    slab.holes.some((hole) => polygonsOverlap(corners, hole))
  ) {
    throwMcpError(
      ErrorCode.InvalidParams,
      'Item footprint must remain inside its support slab, clear of edges and holes',
    )
  }
}

function validateFloorPose(bridge: SceneOperations, item: ItemNodeType, zoneId: string): void {
  const zone = bridge.getNode(zoneId as AnyNodeId)
  if (zone?.type !== 'zone' || zone.parentId !== item.parentId) {
    throwMcpError(ErrorCode.InvalidParams, `Room not found on the item's level: ${zoneId}`)
  }
  const corners = floorFootprint(item)
  if (
    !corners.every((corner) => pointInPolygon(corner, zone.polygon)) ||
    polygonsIntersect(corners, zone.polygon) ||
    zone.holes.some((hole) => polygonsOverlap(corners, hole))
  ) {
    throwMcpError(ErrorCode.InvalidParams, 'Item footprint is outside the selected room')
  }
  const nodes = [...Object.values(bridge.getNodes()).filter((node) => node.id !== item.id), item]
  const collision = findItemItemCollisions({ nodes, levelId: item.parentId ?? undefined }).find(
    ({ aId, bId }) => aId === item.id || bId === item.id,
  )
  if (collision) throwMcpError(ErrorCode.InvalidParams, collision.message)
  const blockedDoor = findBlockedDoors({ nodes, levelId: item.parentId ?? undefined }).find(
    ({ itemId }) => itemId === item.id,
  )
  if (blockedDoor) throwMcpError(ErrorCode.InvalidParams, blockedDoor.message)
}

function result(payload: Record<string, unknown>) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(payload) }],
    structuredContent: payload,
  }
}

export function registerFurnitureTools(server: McpServer, bridge: SceneOperations): void {
  server.registerTool(
    'place_floor_item',
    {
      title: 'Place floor furniture',
      description:
        'Place a known built-in catalog furniture asset inside one room. Position is level-local metres; rotationY is radians. Requires a saved scene version.',
      inputSchema: {
        catalogItemId: z.string().min(1),
        zoneId: NodeIdSchema,
        position: positionSchema,
        rotationY: rotationSchema.default(0),
        expectedVersion: expectedVersionSchema,
      },
      outputSchema: { itemId: z.string(), ...liveSyncOutput },
      annotations: ADDITIVE_TOOL_ANNOTATIONS,
    },
    async ({ catalogItemId, zoneId, position, rotationY, expectedVersion }) => {
      await assertWritableScene(bridge, expectedVersion)
      const asset = findCatalogItem(catalogItemId)
      if (!asset || asset.attachTo) {
        throwMcpError(ErrorCode.InvalidParams, `Unsupported floor catalog asset: ${catalogItemId}`)
      }
      const zone = bridge.getNode(zoneId as AnyNodeId)
      if (zone?.type !== 'zone') {
        throwMcpError(ErrorCode.InvalidParams, `Room not found: ${zoneId}`)
      }
      const level = zone.parentId ? bridge.getNode(zone.parentId as AnyNodeId) : null
      if (level?.type !== 'level') {
        throwMcpError(ErrorCode.InvalidParams, `Room has no level parent: ${zoneId}`)
      }
      const lightEffect = asset.interactive?.effects?.find((effect) => effect.kind === 'light')
      const item = ItemNode.parse({
        parentId: level.id,
        asset,
        position,
        rotation: [0, rotationY, 0],
        ...(lightEffect
          ? {
              lighting: {
                enabled: false,
                intensity: lightEffect.intensityRange[1],
                color: lightEffect.color,
              },
            }
          : {}),
      })
      validateFloorPose(bridge, item, zoneId)
      const itemId = bridge.createNode(item, level.id)
      const persistence = await publishLiveSceneSnapshot(bridge, 'place_floor_item')
      return result({ itemId, ...persistencePayload(persistence) })
    },
  )

  server.registerTool(
    'edit_floor_item',
    {
      title: 'Move or rotate floor furniture',
      description:
        'Update only a floor item position and/or Y rotation in its level-local frame. Slab-supported items must stay fully on the same valid slab with unchanged Y offset. Requires a room containing its full plan footprint and a saved scene version.',
      inputSchema: {
        itemId: NodeIdSchema,
        zoneId: NodeIdSchema,
        position: positionSchema.optional(),
        rotationY: rotationSchema.optional(),
        expectedVersion: expectedVersionSchema,
      },
      outputSchema: {
        itemId: z.string(),
        position: z.array(z.number()).length(3),
        rotationY: z.number(),
        ...liveSyncOutput,
      },
      annotations: DESTRUCTIVE_TOOL_ANNOTATIONS,
    },
    async ({ itemId, zoneId, position, rotationY, expectedVersion }) => {
      await assertWritableScene(bridge, expectedVersion)
      if (position === undefined && rotationY === undefined) {
        throwMcpError(ErrorCode.InvalidParams, 'Supply position and/or rotationY')
      }
      const current = floorItem(bridge, itemId, true)
      validateSlabSupport(bridge, current)
      const next = ItemNode.parse({
        ...current,
        position: position ?? current.position,
        rotation: [current.rotation[0], rotationY ?? current.rotation[1], current.rotation[2]],
      })
      if (current.supportSlabId && next.position[1] !== current.position[1]) {
        throwMcpError(
          ErrorCode.InvalidParams,
          'Slab-supported edits must preserve the item Y offset',
        )
      }
      validateSlabSupport(bridge, next)
      if (
        JSON.stringify(next.position) === JSON.stringify(current.position) &&
        next.rotation[1] === current.rotation[1]
      ) {
        throwMcpError(ErrorCode.InvalidParams, 'Item pose is unchanged')
      }
      validateFloorPose(bridge, next, zoneId)
      bridge.updateNode(current.id as AnyNodeId, {
        position: next.position,
        rotation: next.rotation,
      })
      const persistence = await publishLiveSceneSnapshot(bridge, 'edit_floor_item')
      return result({
        itemId,
        position: next.position,
        rotationY: next.rotation[1],
        ...persistencePayload(persistence),
      })
    },
  )

  server.registerTool(
    'delete_floor_item',
    {
      title: 'Delete floor furniture',
      description: 'Delete exactly one leaf floor furniture item from a saved scene version.',
      inputSchema: { itemId: NodeIdSchema, expectedVersion: expectedVersionSchema },
      outputSchema: { deletedIds: z.array(z.string()), ...liveSyncOutput },
      annotations: DESTRUCTIVE_TOOL_ANNOTATIONS,
    },
    async ({ itemId, expectedVersion }) => {
      await assertWritableScene(bridge, expectedVersion)
      const item = floorItem(bridge, itemId)
      if (item.children.length > 0) {
        throwMcpError(ErrorCode.InvalidRequest, `Item ${itemId} has children`)
      }
      const deletedIds = bridge.deleteNode(item.id as AnyNodeId, false)
      const persistence = await publishLiveSceneSnapshot(bridge, 'delete_floor_item')
      return result({ deletedIds, ...persistencePayload(persistence) })
    },
  )
}
