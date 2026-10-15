import { afterAll, beforeAll, expect, test } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { SceneBridge } from '@pascal-app/mcp/bridge'
import { createSceneOperations } from '@pascal-app/mcp/operations'
import { NextRequest } from 'next/server'
import { SqliteSceneStore } from '../../../packages/mcp/src/storage/sqlite-scene-store'
import { GET, POST } from '../app/api/scenes/[id]/assistant/route'
import { __resetSceneStoreForTests, __setSceneStoreForTests } from './scene-store-server'

let directory: string
let store: SqliteSceneStore
let sceneId: string
let levelId: string
let session: string
const origin = 'http://127.0.0.1:39161'
const savedEnv = Object.fromEntries(
  ['PASCAL_SCENE_API_TOKEN', 'PASCAL_SCENE_API_RATE_LIMIT', 'PASCAL_AI_PROVIDER'].map((key) => [
    key,
    process.env[key],
  ]),
)
const state = globalThis as typeof globalThis & Record<symbol, unknown>
const key = Symbol.for('pascal.editor.interior-assistant')

beforeAll(async () => {
  delete process.env.PASCAL_SCENE_API_TOKEN
  process.env.PASCAL_SCENE_API_RATE_LIMIT = '0'
  process.env.PASCAL_AI_PROVIDER = 'mock'
  delete state[key]
  directory = await mkdtemp(join(tmpdir(), 'pascal-stage4-route-'))
  store = new SqliteSceneStore({ databasePath: join(directory, 'pascal.db') })
  __setSceneStoreForTests(store, createSceneOperations({ store }))
  const bridge = new SceneBridge()
  bridge.setScene({}, [])
  bridge.loadDefault()
  levelId = Object.values(bridge.getNodes()).find((n) => n.type === 'level')!.id
  sceneId = (await store.save({ name: 'HTTP approval fixture', graph: bridge.exportJSON() })).id
})

afterAll(async () => {
  delete state[key]
  __resetSceneStoreForTests()
  store.close()
  await rm(directory, { recursive: true, force: true })
  for (const [name, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
})

function request(body?: unknown, headers: Record<string, string> = {}, query = '') {
  return new NextRequest(`${origin}/api/scenes/${sceneId}/assistant${query}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      origin,
      host: new URL(origin).host,
      'content-type': 'application/json',
      'x-pascal-assistant': '1',
      ...(session ? { cookie: session } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}
const context = () => ({ params: Promise.resolve({ id: sceneId }) })

test('same-origin session boundary rejects cross-site, unauthenticated and direct-operation requests', async () => {
  expect(
    (await GET(request(undefined, { origin: 'http://127.0.0.1:9999' }), context())).status,
  ).toBe(403)
  expect((await GET(request(undefined, { 'x-pascal-assistant': '' }), context())).status).toBe(403)
  expect(
    (await POST(request({ action: 'propose', prompt: 'test', version: 1 }), context())).status,
  ).toBe(401)
  const start = await GET(request(), context())
  expect(await start.json()).toEqual({ mode: 'mock', configured: true, model: null })
  const setCookie = start.headers.get('set-cookie')!
  expect(setCookie).toContain('HttpOnly')
  expect(setCookie.toLowerCase()).toContain('samesite=strict')
  session = setCookie.split(';')[0]!
  expect(
    (
      await POST(
        request({ action: 'approve', operation: { tool: 'delete_floor_item' }, version: 1 }),
        context(),
      )
    ).status,
  ).toBe(400)
  process.env.PASCAL_SCENE_API_TOKEN = 'test-only-token'
  expect((await GET(request(), context())).status).toBe(401)
  delete process.env.PASCAL_SCENE_API_TOKEN
  process.env.PASCAL_AI_PROVIDER = 'openai'
  expect(
    (await POST(request({ action: 'propose', prompt: 'create room', version: 1 }), context()))
      .status,
  ).toBe(403)
  process.env.PASCAL_AI_PROVIDER = 'mock'
  expect((await store.load(sceneId))!.version).toBe(1)
})

test('HTTP preview stays unsaved, owner approves once, and another session cannot use the proposal', async () => {
  const response = await POST(
    request({
      action: 'propose',
      prompt: `create room Study on ${levelId} at 0, 0 size 4, 5`,
      version: 1,
    }),
    context(),
  )
  const body = await response.json()
  expect(response.status).toBe(200)
  expect(body.proposal.status).toBe('pending')
  expect((await store.load(sceneId))!.version).toBe(1)
  const action = { action: 'approve', proposalId: body.proposal.id, version: 1 }
  expect(
    (await POST(request(action, { cookie: 'pascal-assistant-session=another-owner' }), context()))
      .status,
  ).toBe(404)
  const approved = await (await POST(request(action), context())).json()
  expect(approved.proposal.status).toBe('succeeded')
  expect(approved.proposal.result.version).toBe(2)
  const saved = (await store.load(sceneId))!
  expect(Object.values(saved.graph.nodes).filter((n) => n.type === 'wall')).toHaveLength(4)
  expect((await (await POST(request(action), context())).json()).proposal.result.version).toBe(2)
  expect((await store.load(sceneId))!.graph).toEqual(saved.graph)
  expect(
    (await GET(request(undefined, {}, `?proposalId=${body.proposal.id}`), context())).status,
  ).toBe(200)
})

test('design alternatives stay unsaved until one is selected and approved through HTTP', async () => {
  const before = (await store.load(sceneId))!
  const response = await POST(
    request({
      action: 'propose',
      prompt: 'Design this living room in a Scandinavian style',
      version: before.version,
    }),
    context(),
  )
  const { proposal, message } = await response.json()
  expect(response.status, message).toBe(200)
  expect(proposal, message).not.toBeNull()
  expect(proposal.design.alternatives.length).toBeGreaterThanOrEqual(2)
  expect((await store.load(sceneId))!.graph).toEqual(before.graph)
  const action = { action: 'approve', proposalId: proposal.id, version: before.version }
  expect((await POST(request(action), context())).status).toBe(400)
  expect((await store.load(sceneId))!.version).toBe(before.version)
  const selected = proposal.design.alternatives[1]
  const result = await (
    await POST(request({ ...action, alternativeId: selected.id }), context())
  ).json()
  expect(result.proposal.status, JSON.stringify(result)).toBe('succeeded')
  const saved = (await store.load(sceneId))!
  expect(saved.version).toBe(before.version + selected.steps.length)
  const lamp = Object.values(saved.graph.nodes).find(
    (node) => node.type === 'item' && node.asset.id === 'floor-lamp',
  )
  expect(lamp?.type === 'item' && lamp.lighting?.enabled).toBe(true)
  await POST(request({ ...action, alternativeId: proposal.design.alternatives[0].id }), context())
  expect((await store.load(sceneId))!.graph).toEqual(saved.graph)
})
