import { afterEach, expect, test } from 'bun:test'
import { assistantPlanner } from './assistant-provider'
import { guardSceneApiRequest } from './scene-api-security'

const keys = ['PASCAL_SCENE_API_TOKEN', 'PASCAL_SCENE_API_RATE_LIMIT'] as const
const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]))
afterEach(() => {
  for (const key of keys) {
    if (previous[key] === undefined) delete process.env[key]
    else process.env[key] = previous[key]
  }
})

test('public-host requests require configured authentication; loopback is a local trust boundary', () => {
  delete process.env.PASCAL_SCENE_API_TOKEN
  process.env.PASCAL_SCENE_API_RATE_LIMIT = '0'
  expect(guardSceneApiRequest(new Request('https://example.test/api/scenes'))?.status).toBe(503)
  expect(guardSceneApiRequest(new Request('http://127.0.0.1:3000/api/scenes'))).toBeNull()
})

test('deployment gap: a loopback Host header is trusted without checking the network peer', () => {
  delete process.env.PASCAL_SCENE_API_TOKEN
  process.env.PASCAL_SCENE_API_RATE_LIMIT = '0'
  const request = new Request('https://example.test/api/scenes', { headers: { host: '127.0.0.1' } })
  expect(guardSceneApiRequest(request)).toBeNull()
})

test('configured token protects requests even with a loopback Host header', () => {
  process.env.PASCAL_SCENE_API_TOKEN = 'stage6-test-only'
  process.env.PASCAL_SCENE_API_RATE_LIMIT = '0'
  const url = 'http://127.0.0.1:3000/api/scenes'
  expect(guardSceneApiRequest(new Request(url))?.status).toBe(401)
  expect(
    guardSceneApiRequest(
      new Request(url, { headers: { authorization: 'Bearer stage6-test-only' } }),
    ),
  ).toBeNull()
})

test('deployment gap: untrusted forwarded IP changes select independent rate buckets', () => {
  delete process.env.PASCAL_SCENE_API_TOKEN
  process.env.PASCAL_SCENE_API_RATE_LIMIT = '1'
  const key = crypto.randomUUID()
  const request = (client: string) =>
    new Request('http://127.0.0.1:3000/api/scenes', { headers: { 'x-forwarded-for': client } })
  expect(guardSceneApiRequest(request(key))).toBeNull()
  expect(guardSceneApiRequest(request(key))?.status).toBe(429)
  expect(guardSceneApiRequest(request(`${key}-different`))).toBeNull()
})

const provider = {
  PASCAL_AI_PROVIDER: 'openai',
  OPENAI_API_KEY: 'stage6-fake-key',
  PASCAL_AI_MODEL: 'test-only',
}
const context = {
  scene: { id: 'isolated-test', name: 'Private fixture room', version: 1 },
  selectedIds: [],
  nodes: [],
  assets: [],
  finishes: { floor: [], wall: [] },
}

test('simulated provider timeout aborts planning and cannot produce an executable proposal', async () => {
  const controller = new AbortController()
  const fakeFetch = (async (_url: unknown, init: RequestInit) => {
    controller.abort(new DOMException('Simulated provider timeout', 'TimeoutError'))
    init.signal!.throwIfAborted()
    throw new Error('Unreachable')
  }) as typeof fetch
  await expect(
    assistantPlanner(provider, fakeFetch).plan('turn lamp on', context, controller.signal),
  ).rejects.toThrow('Simulated provider timeout')
})

test('provider disclosure includes scene context, but credentials stay out of the JSON payload', async () => {
  let body = ''
  const fakeFetch = (async (_url: unknown, init: RequestInit) => {
    body = String(init.body)
    return Response.json({
      status: 'completed',
      output: [
        {
          type: 'function_call',
          name: 'propose_scene_operation',
          arguments: JSON.stringify({ message: 'Please select a lamp.', operation: null }),
        },
      ],
    })
  }) as typeof fetch
  await assistantPlanner(provider, fakeFetch).plan(
    'turn lamp on',
    context,
    new AbortController().signal,
  )
  expect(body).toContain('Private fixture room')
  expect(body).not.toContain(provider.OPENAI_API_KEY)
  expect(JSON.parse(body)).toMatchObject({ store: false, max_output_tokens: 2000 })
})
