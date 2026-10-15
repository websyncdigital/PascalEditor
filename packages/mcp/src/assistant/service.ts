import { randomUUID } from 'node:crypto'
import type { SceneGraph } from '@pascal-app/core/clone-scene-graph'
import type { AnyNodeId } from '@pascal-app/core/schema'
import type { SceneStore, SceneWithGraph } from '../storage/types'
import { MCP_CATALOG_ITEMS } from '../tools/asset-catalog'
import {
  type AssistantPlanner,
  type AssistantProposal,
  type PlannerContext,
  plannerOutputSchema,
} from './contracts'
import type { DesignRequest } from './design-contracts'
import { assertDesignPreserved, callDesignStep } from './design-execution'
import { planRoomDesign } from './design-layout'
import { parseDesignRequest } from './design-request'
import { callOperation, graphHash, previewStore, serialized, withSceneTools } from './runtime'

export class AssistantError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message)
  }
}

function assertCurrent(
  scene: SceneWithGraph | null,
  version: number,
  hash?: string,
): asserts scene is SceneWithGraph {
  if (!scene) throw new AssistantError('not_found', 'Saved scene no longer exists.', 404)
  if (scene.version !== version || (hash && graphHash(scene.graph) !== hash)) {
    throw new AssistantError(
      'stale_scene',
      'The scene changed. Request a fresh proposal before approving.',
      409,
    )
  }
}

function summarizeNode(node: unknown): unknown {
  if (!node) return null
  const n = node as Record<string, unknown>
  return Object.fromEntries(
    [
      'id',
      'type',
      'name',
      'parentId',
      'position',
      'rotation',
      'scale',
      'polygon',
      'floor',
      'wallMaterial',
      'material',
      'frontMaterial',
      'backMaterial',
      'start',
      'end',
      'height',
      'thickness',
      'children',
      'lighting',
      'asset',
    ]
      .filter((key) => n[key] !== undefined)
      .map((key) => [key, key === 'asset' ? { id: (n.asset as { id?: string }).id } : n[key]]),
  )
}

function changes(before: SceneGraph, after: SceneGraph): AssistantProposal['changes'] {
  return ([...new Set([...Object.keys(before.nodes), ...Object.keys(after.nodes)])] as AnyNodeId[])
    .filter((id) => JSON.stringify(before.nodes[id]) !== JSON.stringify(after.nodes[id]))
    .map((id) => ({
      id,
      type: ((after.nodes[id] ?? before.nodes[id]) as { type: string }).type,
      before: summarizeNode(before.nodes[id]),
      after: summarizeNode(after.nodes[id]),
    }))
}

export class InteriorAssistantService {
  private proposals = new Map<
    string,
    { owner: string; proposal: AssistantProposal; cancelled: boolean }
  >()
  constructor(
    private store: SceneStore,
    private now: () => number = Date.now,
  ) {}

  private entry(owner: string, id: string) {
    const entry = this.proposals.get(id)
    if (!entry || entry.owner !== owner)
      throw new AssistantError(
        'proposal_not_found',
        'This proposal is unavailable. Request a new one.',
        404,
      )
    return entry
  }

  get(owner: string, id: string): AssistantProposal {
    return structuredClone(this.entry(owner, id).proposal)
  }

  cancel(owner: string, id: string): AssistantProposal {
    const entry = this.entry(owner, id)
    entry.cancelled = true
    if (entry.proposal.status === 'pending') entry.proposal.status = 'cancelled'
    return structuredClone(entry.proposal)
  }

  async propose(
    owner: string,
    sceneId: string,
    version: number,
    prompt: string,
    selectedIds: string[],
    planner: AssistantPlanner,
    signal: AbortSignal,
  ) {
    for (const [id, entry] of this.proposals) {
      if (entry.proposal.expiresAt < this.now() && entry.proposal.status !== 'executing')
        this.proposals.delete(id)
    }
    if (this.proposals.size >= 200)
      throw new AssistantError('busy', 'Assistant is busy. Try again later.', 429)
    if (!prompt.trim() || prompt.length > 2000)
      throw new AssistantError('invalid_request', 'Use a request between 1 and 2,000 characters.')
    const scene = await this.store.load(sceneId)
    assertCurrent(scene, version)
    if (scene.nodeCount > 500)
      throw new AssistantError(
        'scene_too_large',
        'This assistant currently supports scenes up to 500 nodes.',
      )
    const design = parseDesignRequest(prompt, scene.graph, selectedIds)
    if (design) {
      if ('message' in design) return { message: design.message, proposal: null }
      return this.proposeDesign(owner, scene, design.request, signal)
    }
    const context = await serialized(() =>
      withSceneTools(previewStore(scene), scene, async (client) => {
        const finishes = { floor: [], wall: [] } as PlannerContext['finishes']
        for (const surface of ['floor', 'wall'] as const) {
          const response = await client.callTool({
            name: 'search_finish_materials',
            arguments: { surface, limit: 50 },
          })
          if (response.isError)
            throw new AssistantError('discovery_failed', 'Could not discover supported finishes.')
          finishes[surface] = (
            response.structuredContent as { materials: typeof finishes.floor }
          ).materials
        }
        return {
          scene: { id: scene.id, name: scene.name, version: scene.version },
          selectedIds: selectedIds.filter((id) => Boolean(scene.graph.nodes[id as AnyNodeId])),
          nodes: Object.values(scene.graph.nodes)
            .filter((n) => ['item', 'zone', 'level'].includes((n as { type: string }).type))
            .map((n) => summarizeNode(n)) as PlannerContext['nodes'],
          assets: MCP_CATALOG_ITEMS.filter((asset) => !asset.attachTo).map(
            ({ id, name, dimensions }) => ({ id, name, dimensions }),
          ),
          finishes,
        }
      }),
    )
    signal.throwIfAborted()
    const output = plannerOutputSchema.parse(await planner.plan(prompt, context, signal))
    signal.throwIfAborted()
    if (!output.operation) return { message: output.message, proposal: null }
    const operation = output.operation
    const hash = graphHash(scene.graph)
    const preview = await serialized(async () => {
      signal.throwIfAborted()
      assertCurrent(await this.store.load(sceneId), version, hash)
      return withSceneTools(previewStore(scene), scene, async (client, bridge) => {
        await callOperation(client, operation, version)
        const validation = bridge.validateScene()
        if (!validation.valid)
          throw new AssistantError('invalid_scene', 'The proposed result failed scene validation.')
        return bridge.exportJSON()
      })
    })
    signal.throwIfAborted()
    const diff = changes(scene.graph, preview)
    if (!diff.length)
      throw new AssistantError('no_change', 'The request would not change the scene.')
    if (diff.length > 100)
      throw new AssistantError(
        'too_many_changes',
        'This operation affects more than 100 nodes. Use a smaller request.',
      )
    const proposal: AssistantProposal = {
      id: randomUUID(),
      sceneId,
      sceneName: scene.name,
      version,
      graphHash: hash,
      expiresAt: this.now() + 10 * 60_000,
      mode: planner.mode,
      status: 'pending',
      message: output.message,
      operation,
      changes: diff,
    }
    this.proposals.set(proposal.id, { owner, proposal, cancelled: false })
    return { message: output.message, proposal: structuredClone(proposal) }
  }

  private async proposeDesign(
    owner: string,
    scene: SceneWithGraph,
    request: DesignRequest,
    signal: AbortSignal,
  ) {
    signal.throwIfAborted()
    const planned = planRoomDesign(scene.graph, request)
    const hash = graphHash(scene.graph)
    const accepted = [] as typeof planned.alternatives
    for (const alternative of planned.alternatives) {
      try {
        await serialized(async () => {
          signal.throwIfAborted()
          assertCurrent(await this.store.load(scene.id), scene.version, hash)
          const preview = previewStore(scene)
          await withSceneTools(preview, scene, async (client, bridge) => {
            const created = new Map<number, string>()
            for (const [index, step] of alternative.steps.entries()) {
              signal.throwIfAborted()
              await callDesignStep(client, step, scene.version + index, created, index)
            }
            if (!bridge.validateScene().valid) throw new Error('Scene schema validation failed.')
            assertDesignPreserved(scene.graph, bridge.exportJSON(), request, alternative)
          })
        })
        alternative.validation.push(
          'Every operation passed the registered Pascal tool against a disposable snapshot; protected and unrelated data are preserved.',
        )
        accepted.push(alternative)
      } catch (error) {
        signal.throwIfAborted()
        if (error instanceof AssistantError) throw error
        planned.rejectedAlternatives.push(
          `${alternative.title}: ${error instanceof Error ? error.message : 'Tool validation failed.'}`,
        )
      }
    }
    signal.throwIfAborted()
    if (!accepted.length)
      return {
        proposal: null,
        message: `No safe design is available. ${planned.rejectedAlternatives.join(' ').slice(0, 1500)}`,
      }
    const message = `${accepted.length} validated alternative${accepted.length === 1 ? '' : 's'} for ${planned.roomName}. Compare the furniture, finishes and limitations, then select one to approve. Nothing has been saved.`
    const proposal: AssistantProposal = {
      id: randomUUID(),
      sceneId: scene.id,
      sceneName: scene.name,
      version: scene.version,
      graphHash: hash,
      expiresAt: this.now() + 10 * 60_000,
      mode: 'mock',
      status: 'pending',
      message,
      operation: null,
      changes: [],
      design: {
        request,
        roomName: planned.roomName,
        alternatives: accepted,
        rejectedAlternatives: planned.rejectedAlternatives,
      },
    }
    this.proposals.set(proposal.id, { owner, proposal, cancelled: false })
    return { message, proposal: structuredClone(proposal) }
  }

  async approve(
    owner: string,
    id: string,
    sceneId: string,
    version: number,
    alternativeId?: string,
  ): Promise<AssistantProposal> {
    const entry = this.entry(owner, id)
    const p = entry.proposal
    if (p.sceneId !== sceneId)
      throw new AssistantError('scene_mismatch', 'Proposal belongs to another scene.', 409)
    if (p.status !== 'pending') return structuredClone(p)
    if (p.expiresAt < this.now())
      throw new AssistantError('proposal_expired', 'Proposal expired. Request a new one.', 409)
    if (version !== p.version)
      throw new AssistantError('stale_scene', 'Scene version changed. Request a new proposal.', 409)
    if (p.design) return this.approveDesign(entry, alternativeId)
    if (!p.operation) throw new AssistantError('invalid_proposal', 'Proposal has no operation.')
    p.status = 'executing'
    return serialized(async () => {
      if (entry.cancelled) {
        p.status = 'cancelled'
        return structuredClone(p)
      }
      let expectedGraph: SceneGraph | undefined
      let toolError: string | undefined
      try {
        const before = await this.store.load(sceneId)
        assertCurrent(before, p.version, p.graphHash)
        await withSceneTools(this.store, before, async (client, bridge) => {
          try {
            await callOperation(client, p.operation!, p.version)
          } catch (error) {
            toolError = error instanceof Error ? error.message : 'Scene operation failed'
          }
          expectedGraph = bridge.exportJSON()
        })
        const saved = await this.store.load(sceneId)
        if (!saved) throw new Error('Could not read the saved result')
        const hash = graphHash(saved.graph)
        const changed = hash !== p.graphHash
        if (
          (!toolError || toolError.includes('live_sync_event_failed')) &&
          changed &&
          expectedGraph &&
          hash === graphHash(expectedGraph) &&
          saved.version === p.version + 1
        ) {
          p.status = toolError ? 'saved_with_warning' : 'succeeded'
          p.changes = changes(before.graph, saved.graph)
          p.result = {
            version: saved.version,
            graphHash: hash,
            message: toolError
              ? 'The change is saved, but live notification failed. Refresh the scene; do not retry this proposal.'
              : 'The approved change was saved and verified.',
          }
        } else {
          p.status = changed || saved.version !== p.version ? 'conflict' : 'failed'
          p.result = {
            version: saved.version,
            graphHash: hash,
            message:
              toolError ??
              'The saved result did not match the approved operation. Inspect the scene before trying again.',
          }
        }
      } catch (error) {
        p.status =
          error instanceof AssistantError && error.code === 'stale_scene' ? 'conflict' : 'uncertain'
        p.result = {
          version: p.version,
          graphHash: p.graphHash,
          message:
            error instanceof AssistantError
              ? error.message
              : 'The result could not be verified. Refresh and inspect the scene before requesting another operation.',
        }
      }
      return structuredClone(p)
    })
  }

  private async approveDesign(
    entry: { proposal: AssistantProposal; cancelled: boolean },
    alternativeId?: string,
  ): Promise<AssistantProposal> {
    const p = entry.proposal
    const design = p.design!
    const alternative = design.alternatives.find((option) => option.id === alternativeId)
    if (!alternative)
      throw new AssistantError(
        'alternative_required',
        'Select one of the validated design alternatives before approving.',
      )
    p.status = 'executing'
    design.selectedAlternativeId = alternative.id
    return serialized(async () => {
      let completed = 0
      let latest: SceneWithGraph | null = null
      const deadline = this.now() + 60_000
      try {
        if (entry.cancelled) {
          p.status = 'cancelled'
          return structuredClone(p)
        }
        if (p.expiresAt < this.now())
          throw new AssistantError('proposal_expired', 'Proposal expired while queued.', 409)
        const before = await this.store.load(p.sceneId)
        assertCurrent(before, p.version, p.graphHash)
        latest = before
        await withSceneTools(this.store, before, async (client, bridge) => {
          const created = new Map<number, string>()
          for (const [index, step] of alternative.steps.entries()) {
            if (entry.cancelled || this.now() > deadline)
              throw new AssistantError(
                'cancelled',
                'Stopped before the next operation. Earlier verified changes remain saved.',
              )
            assertCurrent(
              await this.store.load(p.sceneId),
              latest!.version,
              graphHash(latest!.graph),
            )
            let toolError: unknown
            try {
              await callDesignStep(client, step, latest!.version, created, index)
            } catch (error) {
              toolError = error
            }
            const saved = await this.store.load(p.sceneId)
            const notificationFailed =
              toolError instanceof Error && toolError.message.includes('live_sync_event_failed')
            if (
              !saved ||
              (toolError && !notificationFailed) ||
              saved.version !== latest!.version + 1 ||
              graphHash(saved.graph) !== graphHash(bridge.exportJSON()) ||
              graphHash(saved.graph) === graphHash(latest!.graph)
            ) {
              throw (
                toolError ??
                new Error(
                  'Saved operation could not be verified. Inspect the scene; do not retry automatically.',
                )
              )
            }
            latest = saved
            completed++
            assertDesignPreserved(before.graph, saved.graph, design.request, alternative)
            if (notificationFailed)
              throw new Error(
                'The operation saved, but its notification failed. Remaining operations were stopped; refresh before requesting a new design.',
              )
          }
          if (!bridge.validateScene().valid)
            throw new Error('Final scene validation failed. Inspect the saved scene.')
        })
        assertCurrent(await this.store.load(p.sceneId), latest!.version, graphHash(latest!.graph))
        p.status = 'succeeded'
        p.changes = changes(before.graph, latest!.graph)
        p.result = {
          version: latest!.version,
          graphHash: graphHash(latest!.graph),
          completedSteps: completed,
          message: `${completed} approved operations saved and verified. Furniture remains editable. Other alternatives were not applied.`,
        }
      } catch (error) {
        const cancelled = error instanceof AssistantError && error.code === 'cancelled'
        let uncertain = false
        let observed: SceneWithGraph | null = null
        try {
          observed = await this.store.load(p.sceneId)
          uncertain =
            !observed ||
            observed.version !== (latest?.version ?? p.version) ||
            graphHash(observed.graph) !== (latest ? graphHash(latest.graph) : p.graphHash)
        } catch {
          uncertain = true
        }
        p.status = completed
          ? 'partial'
          : error instanceof AssistantError && error.code === 'stale_scene'
            ? 'conflict'
            : uncertain
              ? 'uncertain'
              : cancelled
                ? 'cancelled'
                : 'failed'
        p.result = {
          version: observed?.version ?? latest?.version ?? p.version,
          graphHash: observed
            ? graphHash(observed.graph)
            : latest
              ? graphHash(latest.graph)
              : p.graphHash,
          completedSteps: completed,
          message: `${completed} of ${alternative.steps.length} operations verified. ${error instanceof Error ? error.message : 'Execution stopped.'} Refresh and request a new proposal from the saved state; this approval will not run again.`,
        }
      }
      return structuredClone(p)
    })
  }
}
