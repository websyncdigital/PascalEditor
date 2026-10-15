import { z } from 'zod'
import type { AssistantOperation } from './contracts'

export const designRequestSchema = z.strictObject({
  roomId: z.string().min(1),
  purpose: z.enum(['living', 'bedroom']),
  style: z.enum(['scandinavian', 'modern-minimalist', 'contemporary']),
  mode: z.enum(['design', 'rearrange', 'finishes']).default('design'),
  alternatives: z.number().int().min(1).max(3).default(3),
  protectedIds: z.array(z.string().min(1)).max(50).default([]),
  itemClearance: z.number().finite().min(0.08).max(2).default(0.6),
  wallClearance: z.number().finite().min(0.05).max(1).default(0.15),
  doorClearDepth: z.number().finite().min(0.65).max(2).default(0.8),
  requestedOak: z.boolean().default(false),
  preserveWalls: z.boolean().default(false),
})
export type DesignRequest = z.infer<typeof designRequestSchema>
export interface DesignStep {
  operation: AssistantOperation
  itemFromStep?: number
}
export interface DesignAlternative {
  id: string
  title: string
  explanation: string
  steps: DesignStep[]
  placements: Array<{
    itemId?: string
    assetId: string
    name: string
    position: number[]
    rotationY: number
    action: 'add' | 'move' | 'keep'
  }>
  finishes: { floor?: string; wall?: string }
  lighting?: { enabled: boolean; intensity: number; color: string }
  warnings: string[]
  rejectedPlacements: Record<string, number>
  validation: string[]
}
export interface DesignProposal {
  request: DesignRequest
  roomName: string
  alternatives: DesignAlternative[]
  rejectedAlternatives: string[]
  selectedAlternativeId?: string
}
