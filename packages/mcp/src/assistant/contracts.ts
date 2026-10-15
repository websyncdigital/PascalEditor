import { z } from 'zod'
import type { DesignProposal } from './design-contracts'

const id = z.string().min(1).max(100)
const coordinate = z.number().finite().min(-10000).max(10000)
const position = z.array(coordinate).length(3)
const point = z.array(coordinate).length(2)

export const assistantOperationSchema = z.discriminatedUnion('tool', [
  z.strictObject({
    tool: z.literal('create_room'),
    args: z.strictObject({
      levelId: id,
      name: z.string().min(1).max(100),
      polygon: z.array(point).min(3).max(32),
    }),
  }),
  z.strictObject({
    tool: z.literal('move_zone'),
    args: z.strictObject({ zoneId: id, translate: point }),
  }),
  z.strictObject({
    tool: z.literal('place_floor_item'),
    args: z.strictObject({
      catalogItemId: id,
      zoneId: id,
      position,
      rotationY: z.number().finite(),
    }),
  }),
  z.strictObject({
    tool: z.literal('edit_floor_item'),
    args: z.strictObject({
      itemId: id,
      zoneId: id,
      position: position.nullable(),
      rotationY: z.number().finite().nullable(),
    }),
  }),
  z.strictObject({ tool: z.literal('delete_floor_item'), args: z.strictObject({ itemId: id }) }),
  z.strictObject({
    tool: z.literal('set_room_finish'),
    args: z.strictObject({ zoneId: id, surface: z.enum(['floor', 'wall']), catalogMaterialId: id }),
  }),
  z.strictObject({
    tool: z.literal('configure_item_light'),
    args: z.strictObject({
      itemId: id,
      enabled: z.boolean().nullable(),
      intensity: z.number().finite().min(0).max(10).nullable(),
      color: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .nullable(),
    }),
  }),
])

export type AssistantOperation = z.infer<typeof assistantOperationSchema>
export const plannerOutputSchema = z.strictObject({
  message: z.string().min(1).max(1000),
  operation: assistantOperationSchema.nullable(),
})
export type PlannerOutput = z.infer<typeof plannerOutputSchema>
export interface PlannerContext {
  scene: { id: string; name: string; version: number }
  selectedIds: string[]
  nodes: Array<Record<string, unknown> & { id: string; type: string; name?: string }>
  assets: Array<{ id: string; name: string; dimensions?: number[] }>
  finishes: {
    floor: Array<{ id: string; label: string }>
    wall: Array<{ id: string; label: string }>
  }
}
export interface AssistantPlanner {
  mode: 'mock' | 'live'
  plan(prompt: string, context: PlannerContext, signal: AbortSignal): Promise<PlannerOutput>
}
export type AssistantStatus =
  | 'pending'
  | 'executing'
  | 'succeeded'
  | 'saved_with_warning'
  | 'failed'
  | 'conflict'
  | 'cancelled'
  | 'uncertain'
  | 'partial'
export interface AssistantProposal {
  id: string
  sceneId: string
  sceneName: string
  version: number
  graphHash: string
  expiresAt: number
  mode: 'mock' | 'live'
  status: AssistantStatus
  message: string
  operation: AssistantOperation | null
  design?: DesignProposal
  changes: Array<{ id: string; type: string; before: unknown; after: unknown }>
  result?: { version: number; graphHash: string; message: string; completedSteps?: number }
}
