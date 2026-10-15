import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { getWallZoneSpans, MATERIAL_CATALOG, setZoneIntent } from '@pascal-app/core'
import type { AnyNodeId, WallNode as WallNodeType } from '@pascal-app/core/schema'
import { z } from 'zod'
import type { SceneOperations } from '../operations'
import { DESTRUCTIVE_TOOL_ANNOTATIONS, READ_ONLY_TOOL_ANNOTATIONS } from './annotations'
import { ErrorCode, throwMcpError } from './errors'
import {
  assertLiveSceneCurrent,
  liveSyncOutput,
  persistencePayload,
  publishLiveSceneSnapshot,
} from './live-sync'
import { NodeIdSchema } from './schemas'

const surfaceSchema = z.enum(['floor', 'wall'])
const expectedVersionSchema = z.number().int().positive()
const supportedTexturedFinishes = new Set([
  'concrete-plaster',
  'concrete-polished',
  'concrete-raw',
  'concrete-plate',
  'concrete-stucco',
  'concrete-drywall',
  'siding-lap-white',
  'siding-lap-greige',
  'siding-lap-gray',
  'siding-lap-sage',
  'siding-lap-cedar',
  'siding-lap-forest',
  'siding-lap-navy',
  'siding-lap-yellow',
  'siding-lap-nearblack',
  'siding-lap-clay',
  'siding-batten-cream',
  'siding-batten-sand',
  'siding-batten-charcoal',
  'siding-batten-olive',
])

function isSupportedFinish(item: (typeof MATERIAL_CATALOG)[number], surface: 'floor' | 'wall') {
  return (
    (!item.surfaces || item.surfaces.includes(surface)) &&
    (Object.values(item.preset?.maps ?? {}).every((url) => !url) ||
      supportedTexturedFinishes.has(item.id))
  )
}

function result(payload: Record<string, unknown>) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(payload) }],
    structuredContent: payload,
  }
}

export function registerFinishTools(server: McpServer, bridge: SceneOperations): void {
  server.registerTool(
    'search_finish_materials',
    {
      title: 'Find floor or wall finishes',
      description:
        'Search built-in Pascal finishes supported on a room floor or wall. Returns catalog metadata without changing the scene.',
      inputSchema: {
        surface: surfaceSchema,
        query: z.string().trim().max(80).default(''),
        limit: z.number().int().min(1).max(50).default(20),
      },
      outputSchema: {
        materials: z.array(
          z.object({ id: z.string(), label: z.string(), category: z.string() }),
        ),
      },
      annotations: READ_ONLY_TOOL_ANNOTATIONS,
    },
    async ({ surface, query, limit }) => {
      const term = query.toLowerCase()
      const materials = MATERIAL_CATALOG.filter(
        (item) =>
          isSupportedFinish(item, surface) &&
          `${item.id} ${item.label} ${item.category}`.toLowerCase().includes(term),
      )
        .slice(0, limit)
        .map(({ id, label, category }) => ({ id, label, category }))
      return result({ materials })
    },
  )

  server.registerTool(
    'set_room_finish',
    {
      title: 'Change a room floor or wall finish',
      description:
        'Apply one built-in material to a whole room floor or its boundary walls in a saved scene. Refuses existing partial paint, unsupported surfaces, and stale versions.',
      inputSchema: {
        zoneId: NodeIdSchema,
        surface: surfaceSchema,
        catalogMaterialId: z.string().min(1),
        expectedVersion: expectedVersionSchema,
      },
      outputSchema: {
        zoneId: z.string(),
        surface: surfaceSchema,
        materialRef: z.string(),
        sceneId: z.string(),
        version: z.number().int().positive(),
        ...liveSyncOutput,
      },
      annotations: DESTRUCTIVE_TOOL_ANNOTATIONS,
    },
    async ({ zoneId, surface, catalogMaterialId, expectedVersion }) => {
      await assertLiveSceneCurrent(bridge, expectedVersion)
      if (!bridge.canAppendSceneEvents) {
        throwMcpError(ErrorCode.InvalidRequest, 'Saved-scene event publication is unavailable')
      }
      const zone = bridge.getNode(zoneId as AnyNodeId)
      if (zone?.type !== 'zone' || zone.spaceRole !== 'room') {
        throwMcpError(ErrorCode.InvalidParams, `Room not found: ${zoneId}`)
      }
      const material = MATERIAL_CATALOG.find((item) => item.id === catalogMaterialId)
      if (!material || !isSupportedFinish(material, surface)) {
        throwMcpError(
          ErrorCode.InvalidParams,
          `Unsupported ${surface} catalog material: ${catalogMaterialId}`,
        )
      }
      const materialRef = `library:${material.id}`
      if (surface === 'floor') {
        if (zone.hasFloor === false) {
          throwMcpError(ErrorCode.InvalidRequest, `Room has no floor: ${zoneId}`)
        }
        if (zone.floor?.regions?.length) {
          throwMcpError(ErrorCode.InvalidRequest, 'Room has partial floor paint')
        }
        if (zone.floor?.finish === materialRef) {
          throwMcpError(ErrorCode.InvalidParams, 'Room floor finish is unchanged')
        }
      } else {
        const walls = zone.boundaryWallIds
          .map((id) => bridge.getNode(id as AnyNodeId))
          .filter(
            (node): node is WallNodeType =>
              node?.type === 'wall' && node.parentId === zone.parentId,
          )
        if (!walls.some((wall) => getWallZoneSpans(wall, [zone]).length > 0)) {
          throwMcpError(ErrorCode.InvalidRequest, `Room has no rendered boundary walls: ${zoneId}`)
        }
        if (zone.wallOverrides?.length || walls.some((wall) => wall.faceRegions?.length)) {
          throwMcpError(ErrorCode.InvalidRequest, 'Room has partial wall paint')
        }
        if (zone.wallMaterial === materialRef) {
          throwMcpError(ErrorCode.InvalidParams, 'Room wall finish is unchanged')
        }
      }
      const patch =
        surface === 'floor' ? { floor: { finish: materialRef } } : { wallMaterial: materialRef }
      const plan = setZoneIntent(bridge.getNodes(), { zoneId, patch })
      if (plan.conflicts?.length) {
        throwMcpError(ErrorCode.InvalidRequest, plan.conflicts[0]!.message)
      }
      if (plan.changes.length !== 1 || plan.changes[0]?.op !== 'update' || plan.changes[0].id !== zone.id) {
        throwMcpError(ErrorCode.InvalidRequest, 'Room finish plan changed unexpected nodes')
      }
      bridge.updateNode(zone.id, plan.changes[0].data)
      const persistence = await publishLiveSceneSnapshot(bridge, 'set_room_finish')
      const active = bridge.getActiveScene()!
      return result({
        zoneId,
        surface,
        materialRef,
        sceneId: active.id,
        version: active.version,
        ...persistencePayload(persistence),
      })
    },
  )
}
