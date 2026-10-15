import { randomUUID } from 'node:crypto'
import { AssistantError } from '@pascal-app/mcp/assistant'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { assistantPlanner, assistantProviderStatus } from '@/lib/assistant-provider'
import { getAssistantRuntime, getInteriorAssistant } from '@/lib/assistant-server'
import { guardSceneApiRequest, sceneApiJson } from '@/lib/scene-api-security'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
const cookie = 'pascal-assistant-session'
const bodySchema = z.discriminatedUnion('action', [
  z.strictObject({
    action: z.literal('propose'),
    prompt: z.string().min(1).max(2000),
    version: z.number().int().positive(),
    selectedIds: z.array(z.string().max(100)).max(20).default([]),
    allowLive: z.boolean().default(false),
  }),
  z.strictObject({
    action: z.literal('approve'),
    proposalId: z.string().uuid(),
    version: z.number().int().positive(),
    alternativeId: z.string().max(40).optional(),
  }),
  z.strictObject({ action: z.literal('cancel'), proposalId: z.string().uuid() }),
])
type Context = { params: Promise<{ id: string }> }

function guard(request: NextRequest) {
  const existing = guardSceneApiRequest(request)
  if (existing) return existing
  const origin = request.headers.get('origin')
  const requestOrigin = new URL(request.url)
  // Next normalizes 127.0.0.1 to localhost; Host preserves the browser's actual origin.
  const host = request.headers.get('host')
  if (host) requestOrigin.host = host
  if (
    (origin && origin !== requestOrigin.origin) ||
    request.headers.get('sec-fetch-site') === 'cross-site' ||
    request.headers.get('x-pascal-assistant') !== '1'
  ) {
    return sceneApiJson(
      request,
      { error: 'forbidden', message: 'Use the assistant from the same editor origin.' },
      { status: 403 },
    )
  }
  return null
}

export async function GET(request: NextRequest, { params }: Context) {
  const denied = guard(request)
  if (denied) return denied
  const owner = request.cookies.get(cookie)?.value
  const proposalId = request.nextUrl.searchParams.get('proposalId')
  const { id } = await params
  try {
    if (proposalId) {
      if (!owner) throw new AssistantError('proposal_not_found', 'Proposal is unavailable.', 404)
      const proposal = (await getInteriorAssistant()).get(owner, proposalId)
      if (proposal.sceneId !== id)
        throw new AssistantError('scene_mismatch', 'Proposal belongs to another scene.', 409)
      return sceneApiJson(request, { proposal })
    }
    const response = sceneApiJson(request, assistantProviderStatus())
    if (!owner)
      response.cookies.set(cookie, randomUUID(), {
        httpOnly: true,
        sameSite: 'strict',
        secure: new URL(request.url).protocol === 'https:',
        path: '/',
        maxAge: 86400,
      })
    return response
  } catch (error) {
    return failure(request, error)
  }
}

export async function POST(request: NextRequest, { params }: Context) {
  const denied = guard(request)
  if (denied) return denied
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return sceneApiJson(request, { error: 'invalid_request' }, { status: 415 })
  const owner = request.cookies.get(cookie)?.value
  if (!owner)
    return sceneApiJson(
      request,
      {
        error: 'session_required',
        message: 'Reopen the Assistant tab to initialize your session.',
      },
      { status: 401 },
    )
  try {
    const text = await request.text()
    if (text.length > 8000) throw new AssistantError('too_large', 'Request is too large.', 413)
    const body = bodySchema.parse(JSON.parse(text))
    const { id } = await params
    const service = await getInteriorAssistant()
    if (body.action === 'propose') {
      const planner = assistantPlanner()
      if (planner.mode === 'live' && !body.allowLive)
        throw new AssistantError(
          'live_approval_required',
          'Approve sending this request to the paid AI provider first.',
          403,
        )
      const result = await service.propose(
        owner,
        id,
        body.version,
        body.prompt,
        body.selectedIds,
        planner,
        AbortSignal.any([request.signal, AbortSignal.timeout(45_000)]),
      )
      return sceneApiJson(request, result)
    }
    if (body.action === 'approve')
      return sceneApiJson(request, {
        proposal: await service.approve(
          owner,
          body.proposalId,
          id,
          body.version,
          body.alternativeId,
        ),
      })
    const proposal = service.get(owner, body.proposalId)
    if (proposal.sceneId !== id)
      throw new AssistantError('scene_mismatch', 'Proposal belongs to another scene.', 409)
    return sceneApiJson(request, { proposal: service.cancel(owner, body.proposalId) })
  } catch (error) {
    return failure(request, error)
  }
}

async function failure(request: NextRequest, error: unknown) {
  const native = await getAssistantRuntime()
  if (error instanceof AssistantError || error instanceof native.AssistantError)
    return sceneApiJson(
      request,
      { error: error.code, message: error.message },
      { status: error.status },
    )
  if (error instanceof z.ZodError || error instanceof SyntaxError)
    return sceneApiJson(
      request,
      {
        error: 'invalid_request',
        message: 'The request or provider proposal did not match the allowed operation schema.',
      },
      { status: 400 },
    )
  if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError'))
    return sceneApiJson(
      request,
      {
        error: 'cancelled',
        message: 'Planning was cancelled or timed out. No operation was approved.',
      },
      { status: 408 },
    )
  return sceneApiJson(
    request,
    {
      error: 'operation_refused',
      message:
        error instanceof Error
          ? error.message.slice(0, 500)
          : 'Assistant could not complete the request.',
    },
    { status: 422 },
  )
}
