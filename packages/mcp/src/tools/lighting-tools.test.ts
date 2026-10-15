import { describe, expect, test } from 'bun:test'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { SceneBridge } from '../bridge/scene-bridge'
import { createPascalMcpServer } from '../server'
import { SqliteSceneStore } from '../storage/sqlite-scene-store'

describe('persistent item lighting', () => {
  test('places a real lamp and saves guarded intensity, color and on/off edits', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'pascal-stage3d-lighting-'))
    const databasePath = path.join(directory, 'pascal.db')
    const assetPath = path.resolve(import.meta.dir, '../../../../apps/editor/public/items/floor-lamp/model.glb')
    expect((await fs.stat(assetPath)).isFile()).toBe(true)
    const store = new SqliteSceneStore({ databasePath })
    const bridge = new SceneBridge()
    bridge.setScene({}, [])
    bridge.loadDefault()
    const server = createPascalMcpServer({ bridge, store })
    const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair()
    const client = new Client({ name: 'lighting-persistence-test', version: '1' })
    try {
      await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])
      const call = async (name: string, args: Record<string, unknown>) =>
        client.callTool({ name, arguments: args })
      const good = async (name: string, args: Record<string, unknown>) => {
        const response = await call(name, args)
        expect(response.isError, JSON.stringify(response)).toBeFalsy()
        return response.structuredContent as Record<string, unknown>
      }
      const bad = async (name: string, args: Record<string, unknown>) => {
        const response = await call(name, args)
        expect(response.isError, JSON.stringify({ name, args, response })).toBe(true)
      }
      const level = Object.values(bridge.getNodes()).find((node) => node.type === 'level')!
      const room = await good('create_room', {
        levelId: level.id,
        name: 'Lighting test room',
        polygon: [[0, 0], [6, 0], [6, 5], [0, 5]],
      })
      const saved = await store.save({ name: 'Disposable lighting room', graph: bridge.exportJSON() })
      await good('load_scene', { id: saved.id })
      await bad('configure_item_light', {
        itemId: 'item_missing', enabled: true, expectedVersion: 1,
      })
      const placed = await good('place_floor_item', {
        catalogItemId: 'floor-lamp',
        zoneId: room.zoneId,
        position: [3, 0, 2.5],
        expectedVersion: 1,
      })
      const itemId = placed.itemId as string
      const afterPlace = (await store.load(saved.id))!
      expect(afterPlace.version).toBe(2)
      expect(afterPlace.graph.nodes[itemId]).toMatchObject({
        type: 'item', parentId: level.id,
        asset: { id: 'floor-lamp', src: '/items/floor-lamp/model.glb' },
        lighting: { enabled: false, intensity: 2, color: '#ffffff' },
      })
      await bad('configure_item_light', { itemId, expectedVersion: 2 })
      await bad('configure_item_light', { itemId, color: 'red', expectedVersion: 2 })
      await bad('configure_item_light', { itemId, intensity: 11, expectedVersion: 2 })
      await bad('configure_item_light', { itemId, intensity: 3, expectedVersion: 2 })
      await bad('configure_item_light', { itemId, enabled: true, expectedVersion: 1 })
      expect((await store.load(saved.id))?.version).toBe(2)

      const configured = await good('configure_item_light', {
        itemId, enabled: true, intensity: 1.5, color: '#ffbb66', expectedVersion: 2,
      })
      expect(configured).toMatchObject({
        itemId, sceneId: saved.id, version: 3,
        lighting: { enabled: true, intensity: 1.5, color: '#ffbb66' },
      })
      const afterOn = (await store.load(saved.id))!
      expect(afterOn.graph.nodes[itemId]).toEqual({
        ...afterPlace.graph.nodes[itemId],
        lighting: { enabled: true, intensity: 1.5, color: '#ffbb66' },
      })
      for (const [id, node] of Object.entries(afterPlace.graph.nodes)) {
        if (id !== itemId) expect(afterOn.graph.nodes[id]).toEqual(node)
      }
      await bad('configure_item_light', { itemId, enabled: true, expectedVersion: 3 })
      const switchedOff = await good('configure_item_light', {
        itemId, enabled: false, expectedVersion: 3,
      })
      expect(switchedOff).toMatchObject({
        version: 4, lighting: { enabled: false, intensity: 1.5, color: '#ffbb66' },
      })
      expect(bridge.validateScene().valid).toBe(true)
      expect(await store.listSceneEvents(saved.id)).toHaveLength(3)

      const restartedStore = new SqliteSceneStore({ databasePath })
      try {
        const reopened = (await restartedStore.load(saved.id))!
        expect(reopened.version).toBe(4)
        expect(reopened.graph.nodes[itemId]).toMatchObject({
          lighting: { enabled: false, intensity: 1.5, color: '#ffbb66' },
        })
        const freshBridge = new SceneBridge()
        freshBridge.loadJSON(reopened.graph)
        expect(freshBridge.validateScene().valid).toBe(true)
      } finally {
        restartedStore.close()
      }
    } finally {
      await client.close()
      await server.close()
      store.close()
      await fs.rm(directory, { recursive: true, force: true })
    }
  })
})
