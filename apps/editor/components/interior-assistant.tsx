'use client'

import type { AssistantProposal } from '@pascal-app/mcp/assistant/contracts'
import { useViewer } from '@pascal-app/viewer'
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react'

type Message = { id: number; role: 'You' | 'Assistant'; text: string }
interface SceneAccess {
  sceneId: string
  sceneName: string
  prepare: () => number
  beginExecution: () => { version: number; release: () => void }
  syncResult: () => Promise<void>
}
interface AssistantState extends SceneAccess {
  messages: Message[]
  proposal: AssistantProposal | null
  busy: 'planning' | 'executing' | null
  status: { mode: 'mock' | 'live'; configured: boolean; model: string | null } | null
  error: string | null
  send: (prompt: string, allowLive: boolean) => Promise<void>
  approve: (alternativeId?: string) => Promise<void>
  cancel: () => Promise<void>
}
const Context = createContext<AssistantState | null>(null)

function describeChange(proposal: AssistantProposal): string {
  const op = proposal.operation
  if (!op) return proposal.message
  const label = (id: string) => {
    const node = proposal.changes.find((change) => change.id === id)?.before as {
      name?: string
    } | null
    return node?.name || id
  }
  const metres = (values: number[]) => values.map((value) => Number(value.toFixed(4))).join(', ')
  switch (op.tool) {
    case 'create_room':
      return `Create room “${op.args.name}” on ${label(op.args.levelId)}.`
    case 'move_zone':
      return `Move ${label(op.args.zoneId)} by ${metres(op.args.translate)} metres along X and Z.`
    case 'place_floor_item':
      return `Add ${op.args.catalogItemId} in ${label(op.args.zoneId)} at X, Y, Z: ${metres(op.args.position)} metres.`
    case 'edit_floor_item':
      return [
        op.args.position &&
          `Set ${label(op.args.itemId)} position to X, Y, Z: ${metres(op.args.position)} metres.`,
        op.args.rotationY !== null &&
          `Set ${label(op.args.itemId)} Y rotation to ${Number(((op.args.rotationY * 180) / Math.PI).toFixed(2))} degrees.`,
      ]
        .filter(Boolean)
        .join(' ')
    case 'delete_floor_item':
      return `Delete ${label(op.args.itemId)} from the saved scene.`
    case 'set_room_finish':
      return `Set ${label(op.args.zoneId)} ${op.args.surface} finish to ${op.args.catalogMaterialId}.`
    case 'configure_item_light':
      return `Change ${label(op.args.itemId)} lighting: ${[
        op.args.enabled !== null && (op.args.enabled ? 'On' : 'Off'),
        op.args.intensity !== null && `intensity ${op.args.intensity}`,
        op.args.color !== null && `color ${op.args.color}`,
      ]
        .filter(Boolean)
        .join(', ')}.`
  }
}

export function AssistantProvider({ children, ...scene }: SceneAccess & { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [proposal, setProposal] = useState<AssistantProposal | null>(null)
  const [busy, setBusy] = useState<AssistantState['busy']>(null)
  const [status, setStatus] = useState<AssistantState['status']>(null)
  const [error, setError] = useState<string | null>(null)
  const controller = useRef<AbortController | null>(null)
  const endpoint = `/api/scenes/${encodeURIComponent(scene.sceneId)}/assistant`
  const addMessage = (role: Message['role'], text: string) =>
    setMessages((previous) => [
      ...previous.slice(-39),
      { id: (previous.at(-1)?.id ?? 0) + 1, role, text },
    ])

  async function api(body?: unknown, signal?: AbortSignal) {
    const response = await fetch(endpoint, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', 'x-pascal-assistant': '1' },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.message ?? result.error ?? 'Assistant request failed')
    return result
  }

  useEffect(() => {
    const request = new AbortController()
    fetch(endpoint, { headers: { 'x-pascal-assistant': '1' }, signal: request.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Assistant is unavailable for this session.')
        return response.json()
      })
      .then(setStatus)
      .catch((reason) => {
        if (!request.signal.aborted) setError(reason.message)
      })
    return () => {
      request.abort()
      controller.current?.abort()
    }
  }, [endpoint])

  async function send(prompt: string, allowLive: boolean) {
    if (busy || !status?.configured) return
    setError(null)
    try {
      const version = scene.prepare()
      if (proposal?.status === 'pending') await api({ action: 'cancel', proposalId: proposal.id })
      setProposal(null)
      addMessage('You', prompt)
      setBusy('planning')
      const request = new AbortController()
      controller.current = request
      const result = await api(
        {
          action: 'propose',
          prompt,
          version,
          selectedIds: useViewer.getState().selection.selectedIds,
          allowLive,
        },
        request.signal,
      )
      addMessage('Assistant', result.message)
      setProposal(result.proposal)
    } catch (reason) {
      setError(
        reason instanceof Error && reason.name === 'AbortError'
          ? 'Planning cancelled. No scene change was approved.'
          : reason instanceof Error
            ? reason.message
            : 'Could not plan this change.',
      )
    } finally {
      setBusy(null)
      controller.current = null
    }
  }

  async function approve(alternativeId?: string) {
    if (proposal?.status !== 'pending' || busy) return
    let release: (() => void) | undefined
    setError(null)
    try {
      const lease = scene.beginExecution()
      release = lease.release
      setBusy('executing')
      const result = await api({
        action: 'approve',
        proposalId: proposal.id,
        version: lease.version,
        ...(alternativeId ? { alternativeId } : {}),
      })
      const next = result.proposal as AssistantProposal
      setProposal(next)
      if (
        next.status === 'succeeded' ||
        next.status === 'saved_with_warning' ||
        next.status === 'partial'
      )
        await scene.syncResult()
      addMessage('Assistant', next.result?.message ?? `Operation ${next.status}.`)
    } catch (reason) {
      setProposal((current) => (current ? { ...current, status: 'uncertain' } : current))
      setError(
        `${reason instanceof Error ? reason.message : 'Connection interrupted.'} Inspect or refresh the saved scene before requesting another change; do not retry this approval.`,
      )
    } finally {
      release?.()
      setBusy(null)
    }
  }

  async function cancel() {
    if (busy === 'planning') {
      controller.current?.abort()
      return
    }
    if (!proposal) return
    try {
      const result = await api({ action: 'cancel', proposalId: proposal.id })
      setProposal(result.proposal)
      addMessage(
        'Assistant',
        result.proposal.status === 'executing'
          ? 'Cancellation requested. A save already in progress may finish; its verified result will be shown.'
          : 'Proposal rejected. No operation will run.',
      )
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not cancel.')
    }
  }

  return (
    <Context.Provider
      value={{ ...scene, messages, proposal, busy, status, error, send, approve, cancel }}
    >
      {children}
    </Context.Provider>
  )
}

export function InteriorAssistantPanel() {
  const state = useContext(Context)
  const [prompt, setPrompt] = useState('')
  const [allowLive, setAllowLive] = useState(false)
  const [choice, setChoice] = useState<{ proposalId: string; alternativeId: string } | null>(null)
  const alternativeId =
    choice?.proposalId === state?.proposal?.id ? (choice?.alternativeId ?? '') : ''
  if (!state) return null
  const button =
    'rounded-md border border-border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50'
  return (
    <section
      aria-label="Interior Design Assistant"
      className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4"
    >
      <div>
        <h2 className="font-semibold text-base">Interior Assistant</h2>
        <p className="mt-1 break-words text-muted-foreground text-xs">
          {state.sceneName} · {state.sceneId}
        </p>
        <p className="mt-2 text-xs">
          {state.status?.mode === 'live'
            ? `Live provider · ${state.status.model ?? 'configuration missing'}`
            : 'Mock mode · no paid API calls'}
        </p>
      </div>
      <p className="text-muted-foreground text-sm">
        Request a room design or one change. Compare proposals and approve your choice. Save manual
        edits before requesting a proposal.
      </p>
      <div aria-live="polite" className="space-y-3">
        {state.messages.map((message) => (
          <div key={message.id}>
            <p className="font-medium text-xs">{message.role}</p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm">{message.text}</p>
          </div>
        ))}
      </div>
      {state.proposal && (
        <div className="space-y-3 border-border border-y py-3">
          <p className="font-medium text-sm">
            {state.proposal.status === 'pending'
              ? 'Review proposed change'
              : `Result: ${state.proposal.status.replaceAll('_', ' ')}`}
          </p>
          <p className="text-muted-foreground text-xs">
            Saved version {state.proposal.version}
            {!state.proposal.design && ` · ${state.proposal.changes.length} affected nodes`}
          </p>
          <p className="break-words text-sm">{describeChange(state.proposal)}</p>
          {state.proposal.design && (
            <fieldset
              className="space-y-4"
              disabled={Boolean(state.busy) || state.proposal.status !== 'pending'}
            >
              <legend className="text-sm">
                Compare layouts · {state.proposal.design.roomName}
              </legend>
              <p className="text-muted-foreground text-xs">
                These are proposed arrangements, not saved scene previews. Operations save one at a
                time; cancellation can leave earlier changes saved.
              </p>
              {state.proposal.design.alternatives.map((option) => (
                <div className="space-y-2 border-border border-b pb-3" key={option.id}>
                  <label className="flex gap-2 font-medium text-sm">
                    <input
                      checked={
                        (state.proposal?.design?.selectedAlternativeId ?? alternativeId) ===
                        option.id
                      }
                      name="design-alternative"
                      onChange={() =>
                        setChoice({ proposalId: state.proposal!.id, alternativeId: option.id })
                      }
                      type="radio"
                      value={option.id}
                    />
                    {option.title}
                  </label>
                  <p className="text-sm">{option.explanation}</p>
                  <ul className="space-y-1 text-xs">
                    {option.placements.map((item, index) => (
                      <li key={`${item.itemId ?? item.assetId}-${index}`}>
                        {item.action}: {item.name} · X {item.position[0]?.toFixed(2)}, Z{' '}
                        {item.position[2]?.toFixed(2)} m ·{' '}
                        {Math.round((item.rotationY * 180) / Math.PI)}°
                      </li>
                    ))}
                    {option.finishes.floor && <li>Floor: {option.finishes.floor}</li>}
                    {option.finishes.wall && <li>Walls: {option.finishes.wall}</li>}
                    {option.lighting && (
                      <li>
                        Light: {option.lighting.enabled ? 'On' : 'Off'} · {option.lighting.color} ·
                        intensity {option.lighting.intensity}
                      </li>
                    )}
                  </ul>
                  {option.warnings.map((warning) => (
                    <p className="text-muted-foreground text-xs" key={warning}>
                      {warning}
                    </p>
                  ))}
                  <details className="text-xs">
                    <summary>Validation and exact operations ({option.steps.length})</summary>
                    <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-all">
                      {JSON.stringify(
                        {
                          validation: option.validation,
                          rejectedPlacements: option.rejectedPlacements,
                          steps: option.steps,
                        },
                        null,
                        2,
                      )}
                    </pre>
                  </details>
                </div>
              ))}
              {state.proposal.design.rejectedAlternatives.map((reason) => (
                <p className="text-muted-foreground text-xs" key={reason}>
                  {reason}
                </p>
              ))}
            </fieldset>
          )}
          <details>
            <summary className="cursor-pointer text-xs">
              Exact parameters and affected objects
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all text-xs">
              {JSON.stringify(
                state.proposal.operation?.args ?? state.proposal.design?.request,
                null,
                2,
              )}
            </pre>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all text-xs">
              {JSON.stringify(state.proposal.changes, null, 2)}
            </pre>
          </details>
          {state.proposal.status === 'pending' && (
            <div className="flex gap-2">
              <button
                className={`${button} bg-accent`}
                disabled={Boolean(state.busy) || Boolean(state.proposal.design && !alternativeId)}
                onClick={() => void state.approve(alternativeId || undefined)}
                type="button"
              >
                {state.proposal.design ? 'Approve selected layout' : 'Approve change'}
              </button>
              <button
                className={button}
                disabled={Boolean(state.busy)}
                onClick={() => void state.cancel()}
                type="button"
              >
                Reject
              </button>
            </div>
          )}
          {state.proposal.result && (
            <p className="text-sm">
              {state.proposal.result.message} Saved version: {state.proposal.result.version}.
            </p>
          )}
        </div>
      )}
      {state.error && (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      )}
      {state.busy && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm" role="status">
            {state.busy === 'planning' ? 'Inspecting and validating…' : 'Applying and verifying…'}
          </p>
          <button className={button} onClick={() => void state.cancel()} type="button">
            Cancel
          </button>
        </div>
      )}
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          if (prompt.trim()) void state.send(prompt.trim(), allowLive)
        }}
      >
        <label className="block text-sm" htmlFor="interior-request">
          Your request
        </label>
        <textarea
          className="min-h-24 w-full rounded-md border border-border bg-background p-2 text-sm"
          disabled={Boolean(state.busy)}
          id="interior-request"
          maxLength={2000}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Design my living room in a Scandinavian style"
          value={prompt}
        />
        {state.status?.mode === 'live' && (
          <label className="flex gap-2 text-xs">
            <input
              checked={allowLive}
              onChange={(event) => setAllowLive(event.target.checked)}
              type="checkbox"
            />
            Allow this request and scene context to be sent to the configured paid API provider.
          </label>
        )}
        <button
          className={`${button} w-full bg-accent`}
          disabled={
            Boolean(state.busy) ||
            !prompt.trim() ||
            !state.status?.configured ||
            (state.status.mode === 'live' && !allowLive)
          }
          type="submit"
        >
          Preview change
        </button>
      </form>
      <details className="text-muted-foreground text-xs">
        <summary className="cursor-pointer">Mock examples</summary>
        <ul className="mt-2 space-y-2">
          <li>Move selected by 0.10 m on x</li>
          <li>Design my living room in a Scandinavian style</li>
          <li>Make this bedroom modern minimalist</li>
          <li>Show me three alternative layouts</li>
          <li>Rearrange the furniture without changing the walls</li>
          <li>Design this living room in a Contemporary style; keep sofa</li>
          <li>Use a light oak floor and warm lighting</li>
          <li>Rotate selected by 15 degrees</li>
          <li>Turn lamp off</li>
          <li>Set lamp intensity to 1.2</li>
          <li>Set lamp color to #00aaff</li>
          <li>Set selected floor material to concrete-polished</li>
          <li>Add sofa to ROOM_ID at 3, 0, 2</li>
          <li>Create room Study on LEVEL_ID at 0, 0 size 4, 5</li>
          <li>Move room ROOM_ID by 0.2, 0</li>
          <li>Delete selected</li>
        </ul>
      </details>
    </section>
  )
}
