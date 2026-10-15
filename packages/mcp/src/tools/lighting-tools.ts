import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { AnyNodeId } from '@pascal-app/core/schema'
import { z } from 'zod'
import type { SceneOperations } from '../operations'
import { DESTRUCTIVE_TOOL_ANNOTATIONS } from './annotations'
import { ErrorCode, throwMcpError } from './errors'
import {
  assertLiveSceneCurrent,
  liveSyncOutput,
  persistencePayload,
  publishLiveSceneSnapshot,
} from './live-sync'
import { NodeIdSchema } from './schemas'

const lightingSchema = z.object({
  enabled: z.boolean(),
  intensity: z.number().finite().min(0).max(10),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})

export function registerLightingTools(server: McpServer, bridge: SceneOperations): void {
  server.registerTool(
    'configure_item_light',
    {
      title: 'Configure persistent item light',
      description:
        'Change the saved on/off state, point-light intensity or hex color of one existing catalog lamp. Requires the current saved scene version.',
      inputSchema: {
        itemId: NodeIdSchema,
        enabled: z.boolean().optional(),
        intensity: lightingSchema.shape.intensity.optional(),
        color: lightingSchema.shape.color.optional(),
        expectedVersion: z.number().int().positive(),
      },
      outputSchema: {
        itemId: z.string(),
        lighting: lightingSchema,
        sceneId: z.string(),
        version: z.number().int().positive(),
        ...liveSyncOutput,
      },
      annotations: DESTRUCTIVE_TOOL_ANNOTATIONS,
    },
    async ({ itemId, enabled, intensity, color, expectedVersion }) => {
      await assertLiveSceneCurrent(bridge, expectedVersion)
      if (!bridge.canAppendSceneEvents) {
        throwMcpError(ErrorCode.InvalidRequest, 'Saved-scene event publication is unavailable')
      }
      if (enabled === undefined && intensity === undefined && color === undefined) {
        throwMcpError(ErrorCode.InvalidParams, 'Supply enabled, intensity or color')
      }
      const node = bridge.getNode(itemId as AnyNodeId)
      const effect = node?.type === 'item'
        ? node.asset.interactive?.effects.find((entry) => entry.kind === 'light')
        : undefined
      if (node?.type !== 'item' || !effect) {
        throwMcpError(ErrorCode.InvalidParams, `Catalog light item not found: ${itemId}`)
      }
      const next = lightingSchema.parse({
        enabled: enabled ?? node.lighting?.enabled ?? false,
        intensity: intensity ?? node.lighting?.intensity ?? effect.intensityRange[1],
        color: color ?? node.lighting?.color ?? effect.color,
      })
      if (next.intensity < effect.intensityRange[0] || next.intensity > effect.intensityRange[1]) {
        throwMcpError(ErrorCode.InvalidParams, 'Intensity is outside this asset light range')
      }
      if (JSON.stringify(next) === JSON.stringify(node.lighting)) {
        throwMcpError(ErrorCode.InvalidParams, 'Item light configuration is unchanged')
      }
      bridge.updateNode(node.id, { lighting: next })
      const persistence = await publishLiveSceneSnapshot(bridge, 'configure_item_light')
      const active = bridge.getActiveScene()!
      const payload = {
        itemId,
        lighting: next,
        sceneId: active.id,
        version: active.version,
        ...persistencePayload(persistence),
      }
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(payload) }],
        structuredContent: payload,
      }
    },
  )
}
