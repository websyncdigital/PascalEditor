import { describe, expect, test } from 'bun:test'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SceneBridge } from '../bridge/scene-bridge'
import { createSceneOperations, type SceneOperations } from '../operations'
import { SqliteSceneStore } from '../storage/sqlite-scene-store'
import type { SceneStore } from '../storage/types'
import { registerCreateWall } from './create-wall'
import { publishLiveSceneSnapshot } from './live-sync'
import {
  createTestSceneOperations,
  InMemorySceneStore,
  parseToolText,
  type StoredTextContent,
} from './scene-lifecycle/test-utils'

function createBridge(): SceneBridge {
  const bridge = new SceneBridge()
  bridge.setScene({}, [])
  bridge.loadDefault()
  return bridge
}

/** InMemorySceneStore stripped of its scene-event methods. */
function withoutSceneEvents(base: InMemorySceneStore): SceneStore {
  return {
    backend: base.backend,
    save: (opts) => base.save(opts),
    load: (id) => base.load(id),
    list: (opts) => base.list(opts),
    delete: (id, opts) => base.delete(id, opts),
    rename: (id, newName, opts) => base.rename(id, newName, opts),
  }
}

async function connectCreateWall(operations: SceneOperations): Promise<Client> {
  const server = new McpServer({ name: 'test', version: '0.0.0' })
  registerCreateWall(server, operations)
  const [srvT, cliT] = InMemoryTransport.createLinkedPair()
  const client = new Client({ name: 'test-client', version: '0.0.0' })
  await Promise.all([server.connect(srvT), client.connect(cliT)])
  return client
}

async function callCreateWall(
  client: Client,
  bridge: SceneBridge,
): Promise<Record<string, unknown>> {
  const level = Object.values(bridge.getNodes()).find((n) => n.type === 'level')!
  const result = await client.callTool({
    name: 'create_wall',
    arguments: { levelId: level.id, start: [0, 0], end: [4, 0] },
  })
  expect(result.isError).toBeFalsy()
  return parseToolText(result.content as StoredTextContent[])
}

describe('live sync persistence reporting', () => {
  test('warns unbound when no active scene is bound', async () => {
    const bridge = createBridge()
    const { store, operations } = createTestSceneOperations({ bridge })
    const client = await connectCreateWall(operations)

    const parsed = await callCreateWall(client, bridge)
    const persistence = parsed.persistence as { status: string; warning: string }
    expect(persistence.status).toBe('unbound')
    expect(typeof persistence.warning).toBe('string')
    expect(persistence.warning.length).toBeGreaterThan(0)
    expect(await store.listSceneEvents('scene_1')).toEqual([])
  })

  test('omits persistence and appends an event when publish succeeds', async () => {
    const bridge = createBridge()
    const { store, operations } = createTestSceneOperations({ bridge })
    const meta = await store.save({ name: 'Live Scene', graph: operations.exportSceneGraph() })
    operations.setActiveScene(meta)
    const client = await connectCreateWall(operations)

    const parsed = await callCreateWall(client, bridge)
    expect(parsed.persistence).toBeUndefined()
    const events = await store.listSceneEvents(meta.id)
    expect(events).toHaveLength(1)
    expect(events[0]!.kind).toBe('create_wall')
    const saved = await store.load(meta.id)
    expect(saved!.version).toBe(meta.version + 1)
    expect(saved!.graph.nodes[parsed.wallId as string]).toBeDefined()
  })

  test('warns events_unsupported when the store lacks scene events', async () => {
    const bridge = createBridge()
    const base = new InMemorySceneStore()
    const operations = createSceneOperations({ bridge, store: withoutSceneEvents(base) })
    const meta = await base.save({ name: 'Live Scene', graph: operations.exportSceneGraph() })
    operations.setActiveScene(meta)
    const client = await connectCreateWall(operations)

    const parsed = await callCreateWall(client, bridge)
    const persistence = parsed.persistence as { status: string; warning: string }
    expect(persistence.status).toBe('events_unsupported')
    expect(typeof persistence.warning).toBe('string')
  })
})

describe('publishLiveSceneSnapshot', () => {
  test('returns unbound without an active scene', async () => {
    const { operations } = createTestSceneOperations({ bridge: createBridge() })
    expect(await publishLiveSceneSnapshot(operations, 'test')).toBe('unbound')
  })

  test('returns events_unsupported when the store lacks scene events', async () => {
    const base = new InMemorySceneStore()
    const operations = createSceneOperations({
      bridge: createBridge(),
      store: withoutSceneEvents(base),
    })
    const meta = await base.save({ name: 'Live Scene', graph: operations.exportSceneGraph() })
    operations.setActiveScene(meta)
    expect(await publishLiveSceneSnapshot(operations, 'test')).toBe('events_unsupported')
  })

  test('returns published when bound to an event-capable store', async () => {
    const { store, operations } = createTestSceneOperations({ bridge: createBridge() })
    const meta = await store.save({ name: 'Live Scene', graph: operations.exportSceneGraph() })
    operations.setActiveScene(meta)
    expect(await publishLiveSceneSnapshot(operations, 'test')).toBe('published')
    expect(await store.listSceneEvents(meta.id)).toHaveLength(1)
  })

  test('reloads the saved graph after a rejected write', async () => {
    const bridge = createBridge()
    const { store, operations } = createTestSceneOperations({ bridge })
    const initial = await store.save({ name: 'Live Scene', graph: operations.exportSceneGraph() })
    operations.setActiveScene(initial)
    const level = Object.values(bridge.getNodes()).find((node) => node.type === 'level')!
    const externalGraph = operations.exportSceneGraph()
    externalGraph.nodes[level.id] = { ...level, name: 'External edit' }
    const external = await store.save({
      id: initial.id,
      name: initial.name,
      graph: externalGraph,
      expectedVersion: initial.version,
    })

    bridge.updateNode(level.id, { name: 'Unsaved MCP edit' })
    await expect(publishLiveSceneSnapshot(operations, 'test')).rejects.toThrow(
      'live_sync_version_conflict',
    )
    expect(operations.exportSceneGraph()).toEqual(externalGraph)
    expect(operations.getActiveScene()?.version).toBe(external.version)
    expect(bridge.getHistory().pastCount).toBe(0)
    expect(await store.listSceneEvents(initial.id)).toHaveLength(0)

    bridge.updateNode(level.id, { name: 'Retried edit' })
    expect(await publishLiveSceneSnapshot(operations, 'test')).toBe('published')
    expect((await store.load(initial.id))?.version).toBe(external.version + 1)
  })

  test('restores the authoritative SQLite graph after a late version conflict', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'pascal-stage3a-conflict-'))
    const store = new SqliteSceneStore({ databasePath: path.join(directory, 'pascal.db') })
    try {
      const bridge = createBridge()
      const operations = createSceneOperations({ bridge, store })
      const initial = await store.save({ name: 'Disposable room scene', graph: operations.exportSceneGraph() })
      operations.setActiveScene(initial)
      const level = Object.values(bridge.getNodes()).find((node) => node.type === 'level')!
      const externalGraph = operations.exportSceneGraph()
      externalGraph.nodes[level.id] = { ...level, name: 'Concurrent saved edit' }
      const external = await store.save({
        id: initial.id,
        name: initial.name,
        graph: externalGraph,
        expectedVersion: initial.version,
      })

      bridge.updateNode(level.id, { name: 'Rejected MCP edit' })
      await expect(publishLiveSceneSnapshot(operations, 'move_zone')).rejects.toThrow(
        'live_sync_version_conflict',
      )
      const persisted = await store.load(initial.id)
      expect(persisted?.version).toBe(external.version)
      expect(persisted?.graph.nodes[level.id]).toMatchObject({ name: 'Concurrent saved edit' })
      expect(operations.getNode(level.id)).toMatchObject({ name: 'Concurrent saved edit' })
      expect(operations.getActiveScene()?.version).toBe(external.version)
      expect(operations.getHistory().pastCount).toBe(0)
      expect(await store.listSceneEvents(initial.id)).toHaveLength(0)
    } finally {
      store.close()
      await fs.rm(directory, { recursive: true, force: true })
    }
  })

  test('reports an event failure as persisted without retrying the save', async () => {
    const bridge = createBridge()
    const base = new InMemorySceneStore()
    const store: SceneStore = {
      ...withoutSceneEvents(base),
      appendSceneEvent: async () => {
        throw new Error('event unavailable')
      },
    }
    const operations = createSceneOperations({ bridge, store })
    const initial = await base.save({ name: 'Live Scene', graph: operations.exportSceneGraph() })
    operations.setActiveScene(initial)
    const level = Object.values(bridge.getNodes()).find((node) => node.type === 'level')!
    bridge.updateNode(level.id, { name: 'Saved despite event failure' })

    await expect(publishLiveSceneSnapshot(operations, 'test')).rejects.toThrow(
      'live_sync_event_failed',
    )
    const saved = await base.load(initial.id)
    expect(saved?.version).toBe(initial.version + 1)
    expect(saved?.graph.nodes[level.id]).toMatchObject({ name: 'Saved despite event failure' })
    expect(operations.getActiveScene()?.version).toBe(saved?.version)
    expect(await base.listSceneEvents(initial.id)).toHaveLength(0)
  })
})
