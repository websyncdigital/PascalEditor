import { describe, expect, test } from 'bun:test'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { SceneBridge } from '../bridge/scene-bridge'
import { createPascalMcpServer } from '../server'
import { SqliteSceneStore } from '../storage/sqlite-scene-store'

describe('saved floor furniture operations', () => {
  test('places, edits, and deletes a real catalog item while refusing invalid edits', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'pascal-stage3b-furniture-'))
    const databasePath = path.join(directory, 'pascal.db')
    const store = new SqliteSceneStore({ databasePath })
    const bridge = new SceneBridge()
    bridge.setScene({}, [])
    bridge.loadDefault()
    const server = createPascalMcpServer({ bridge, store })
    const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair()
    const client = new Client({ name: 'furniture-persistence-test', version: '1' })
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
        name: 'Furniture test room',
        polygon: [
          [0, 0],
          [8, 0],
          [8, 6],
          [0, 6],
        ],
      })
      const zoneId = room.zoneId as string
      await good('add_door', { wallId: (room.wallIds as string[])[0], t: 0.5 })
      const saved = await store.save({
        name: 'Disposable furniture room',
        graph: bridge.exportJSON(),
      })
      await good('load_scene', { id: saved.id })
      const original = await store.load(saved.id)
      const roomNode = original!.graph.nodes[zoneId]

      await bad('place_floor_item', {
        catalogItemId: 'nonexistent-asset',
        zoneId,
        position: [2, 0, 2],
        expectedVersion: 1,
      })
      await bad('place_floor_item', {
        catalogItemId: 'shelf',
        zoneId,
        position: [2, 0, 2],
        expectedVersion: 1,
      })
      await bad('place_floor_item', {
        catalogItemId: 'sofa',
        zoneId,
        position: [7.9, 0, 2],
        expectedVersion: 1,
      })
      await bad('place_floor_item', {
        catalogItemId: 'sofa',
        zoneId,
        position: [4, 0, 0.9],
        expectedVersion: 1,
      })
      expect((await store.load(saved.id))?.version).toBe(1)

      const placed = await good('place_floor_item', {
        catalogItemId: 'sofa',
        zoneId,
        position: [2, 0, 2],
        expectedVersion: 1,
      })
      const itemId = placed.itemId as string
      const afterPlace = (await store.load(saved.id))!
      expect(afterPlace.version).toBe(2)
      expect(afterPlace.graph.nodes[itemId]).toMatchObject({
        type: 'item',
        parentId: level.id,
        position: [2, 0, 2],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        asset: { id: 'sofa', src: '/items/sofa/model.glb' },
      })
      expect(afterPlace.graph.nodes[zoneId]).toEqual(roomNode)

      await bad('place_floor_item', {
        catalogItemId: 'sofa',
        zoneId,
        position: [2, 0, 2],
        expectedVersion: 1,
      })
      await bad('place_floor_item', {
        catalogItemId: 'dining-chair',
        zoneId,
        position: [2.5, 0, 2],
        expectedVersion: 2,
      })
      await bad('edit_floor_item', {
        itemId: 'item_missing',
        zoneId,
        position: [3, 0, 2],
        expectedVersion: 2,
      })
      await bad('edit_floor_item', {
        itemId,
        zoneId,
        position: [7.9, 0, 2],
        expectedVersion: 2,
      })
      await bad('edit_floor_item', { itemId, zoneId, expectedVersion: 2 })
      await bad('delete_floor_item', { itemId: zoneId, expectedVersion: 2 })
      expect((await store.load(saved.id))?.version).toBe(2)

      const edited = await good('edit_floor_item', {
        itemId,
        zoneId,
        position: [3, 0, 2],
        rotationY: '90°',
        expectedVersion: 2,
      })
      expect(edited.rotationY).toBeCloseTo(Math.PI / 2)
      const afterEdit = (await store.load(saved.id))!
      expect(afterEdit.version).toBe(3)
      expect(afterEdit.graph.nodes[itemId]).toMatchObject({
        position: [3, 0, 2],
        scale: [1, 1, 1],
        asset: { id: 'sofa' },
      })
      expect(afterEdit.graph.nodes[zoneId]).toEqual(roomNode)
      const reopened = new SceneBridge()
      reopened.loadJSON(afterEdit.graph)
      expect(reopened.validateScene().valid).toBe(true)

      await bad('delete_floor_item', { itemId, expectedVersion: 2 })
      expect((await store.load(saved.id))?.version).toBe(3)
      const deleted = await good('delete_floor_item', { itemId, expectedVersion: 3 })
      expect(deleted.deletedIds).toEqual([itemId])
      const afterDelete = (await store.load(saved.id))!
      expect(afterDelete.version).toBe(4)
      expect(afterDelete.graph.nodes[itemId]).toBeUndefined()
      expect(afterDelete.graph.nodes[zoneId]).toEqual(roomNode)
      expect(await store.listSceneEvents(saved.id)).toHaveLength(3)
      const finalBridge = new SceneBridge()
      finalBridge.loadJSON(afterDelete.graph)
      expect(finalBridge.validateScene().valid).toBe(true)
      const restartedStore = new SqliteSceneStore({ databasePath })
      try {
        const restarted = await restartedStore.load(saved.id)
        expect(restarted?.version).toBe(4)
        expect(restarted?.graph.nodes[zoneId]).toEqual(roomNode)
        expect(restarted?.graph.nodes[itemId]).toBeUndefined()
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
