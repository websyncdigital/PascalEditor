import type { SceneGraph } from '@pascal-app/core/clone-scene-graph'
import { z } from 'zod'
import type { SceneOperations } from '../operations'
import { type SceneMeta, SceneVersionConflictError } from '../storage/types'
import { ErrorCode, throwMcpError } from './errors'

export type LiveSyncStatus = 'published' | 'unbound' | 'events_unsupported'

type LiveSyncSkip = Exclude<LiveSyncStatus, 'published'>

/**
 * Output-schema fragment for every tool that mutates the scene. Spread into
 * the tool's `outputSchema` so `persistencePayload` fields survive the SDK's
 * structured-content validation.
 */
export const liveSyncOutput = {
  persistence: z
    .object({
      status: z.enum(['unbound', 'events_unsupported']),
      warning: z.string(),
    })
    .optional(),
}

const LIVE_SYNC_WARNINGS: Record<LiveSyncSkip, string> = {
  unbound:
    'The change was applied to the in-memory session only: no active scene is bound, so nothing was persisted and no live event reached subscribers. Bind a scene with save_scene or load_scene to persist changes.',
  events_unsupported:
    'The change was applied to the in-memory session only: the attached scene store does not support live scene events, so nothing was persisted.',
}

/**
 * Payload fragment matching `liveSyncOutput`: empty after a successful
 * publish, a `persistence` warning when the mutation stayed in-memory.
 */
export function persistencePayload(status: LiveSyncStatus): {
  persistence?: { status: LiveSyncSkip; warning: string }
} {
  if (status === 'published') return {}
  return { persistence: { status, warning: LIVE_SYNC_WARNINGS[status] } }
}

export async function assertLiveSceneCurrent(
  operations: SceneOperations,
  expectedVersion?: number,
): Promise<void> {
  const active = operations.getActiveScene()
  if (!active) {
    if (expectedVersion !== undefined) {
      throwMcpError(ErrorCode.InvalidRequest, 'scene_version_conflict', {
        expectedVersion,
        activeVersion: null,
      })
    }
    return
  }
  if (expectedVersion !== undefined && active.version !== expectedVersion) {
    throwMcpError(ErrorCode.InvalidRequest, 'scene_version_conflict', {
      expectedVersion,
      activeVersion: active.version,
    })
  }
  const stored = await operations.loadStoredScene(active.id)
  if (!stored || stored.version !== active.version) {
    throwMcpError(ErrorCode.InvalidRequest, 'scene_version_conflict', {
      expectedVersion: expectedVersion ?? active.version,
      activeVersion: active.version,
      storedVersion: stored?.version ?? null,
    })
  }
}

/**
 * Persist the bridge's current graph to the active scene and append a live
 * event for browser subscribers. Skips persistence — reporting why — when the
 * MCP session is not currently bound to a saved scene or the store cannot
 * append scene events; callers surface that through `persistencePayload` so
 * the skip is never silent (#725).
 */
export async function publishLiveSceneSnapshot(
  operations: SceneOperations,
  kind: string,
): Promise<LiveSyncStatus> {
  const active = operations.getActiveScene()
  if (!active) return 'unbound'
  if (!operations.canAppendSceneEvents) return 'events_unsupported'

  const graph = operations.exportSceneGraph()
  let meta: SceneMeta
  try {
    meta = await operations.saveScene({
      id: active.id,
      name: active.name,
      projectId: active.projectId,
      ownerId: active.ownerId,
      thumbnailUrl: active.thumbnailUrl,
      graph,
      expectedVersion: active.version,
      saveMode: 'draft',
      publish: false,
      operation: kind,
    })
  } catch (error) {
    // Tools have already changed the bridge; a rejected save must restore its authoritative graph.
    let recovery: { status: 'reloaded'; version: number } | { status: 'unbound'; reason: string }
    try {
      const stored = await operations.loadStoredScene(active.id)
      if (stored) {
        operations.loadJSON(stored.graph)
        operations.setActiveScene(stored)
        operations.clearHistory()
        recovery = { status: 'reloaded', version: stored.version }
      } else {
        operations.clearActiveScene()
        operations.clearHistory()
        recovery = { status: 'unbound', reason: 'scene_missing' }
      }
    } catch {
      operations.clearActiveScene()
      operations.clearHistory()
      recovery = { status: 'unbound', reason: 'reload_failed' }
    }
    if (error instanceof SceneVersionConflictError) {
      throwMcpError(ErrorCode.InvalidRequest, 'live_sync_version_conflict', {
        sceneId: active.id,
        expectedVersion: active.version,
        recovery,
      })
    }
    const message = error instanceof Error ? error.message : String(error)
    throwMcpError(ErrorCode.InternalError, `live_sync_failed: ${message}`, {
      sceneId: active.id,
      recovery,
    })
  }

  operations.setActiveScene(meta)
  try {
    await operations.appendSceneEvent({
      sceneId: meta.id,
      version: meta.version,
      kind,
      graph,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throwMcpError(ErrorCode.InternalError, `live_sync_event_failed: ${message}`, {
      sceneId: meta.id,
      persistedVersion: meta.version,
      eventStatus: 'unknown',
    })
  }
  return 'published'
}

export async function appendLiveSceneEvent(
  operations: SceneOperations,
  sceneId: string,
  version: number,
  kind: string,
  graph: SceneGraph,
): Promise<void> {
  if (!operations.canAppendSceneEvents) return
  await operations.appendSceneEvent({ sceneId, version, kind, graph })
}
