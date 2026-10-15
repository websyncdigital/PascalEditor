import { describe, expect, test } from 'bun:test'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { SceneBridge } from '../bridge/scene-bridge'
import { createPascalMcpServer } from '../server'
import { SqliteSceneStore } from '../storage/sqlite-scene-store'

describe('saved room structure operations', () => {
  test('persists intent, rotation, division, merge, and deletion in disposable SQLite scenes', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'pascal-stage3a-rooms-'))
    const store = new SqliteSceneStore({ databasePath: path.join(directory, 'pascal.db') })
    const bridge = new SceneBridge()
    bridge.loadDefault()
    const server = createPascalMcpServer({ bridge, store })
    const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair()
    const client = new Client({ name: 'room-persistence-test', version: '1' })
    try {
      await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])
      const call = async (name: string, args: Record<string, unknown>) => {
        const response = await client.callTool({ name, arguments: args })
        expect(response.isError, JSON.stringify(response)).toBeFalsy()
        return response.structuredContent as Record<string, unknown>
      }
      const levelId = Object.values(bridge.getNodes()).find((node) => node.type === 'level')!.id
      const room = await call('create_room', {
        levelId,
        name: 'Disposable room',
        polygon: [
          [0, 0],
          [8, 0],
          [8, 4],
          [0, 4],
        ],
      })
      const zoneId = room.zoneId as string
      const baseGraph = bridge.exportJSON()
      const verify = async (sceneId: string, version: number) => {
        const saved = await store.load(sceneId)
        expect(saved?.version).toBe(version)
        const reopened = new SceneBridge()
        reopened.loadJSON(saved!.graph)
        expect(reopened.validateScene().valid).toBe(true)
        return saved!
      }

      const edited = await store.save({ name: 'Room intent and rotation', graph: baseGraph })
      await call('load_scene', { id: edited.id })
      await call('set_zone_intent', { zoneId, patch: { name: 'Updated room' } })
      const renamed = await verify(edited.id, edited.version + 1)
      expect(renamed.graph.nodes[zoneId]).toMatchObject({ name: 'Updated room' })
      await call('rotate_zone', { zoneId, quarterTurns: 1 })
      const rotated = await verify(edited.id, edited.version + 2)
      expect(rotated.graph.nodes[zoneId]).toMatchObject({ name: 'Updated room' })
      expect(rotated.graph.nodes[zoneId]).not.toEqual(renamed.graph.nodes[zoneId])
      expect(await store.listSceneEvents(edited.id)).toHaveLength(2)

      const divided = await store.save({ name: 'Room divide and delete', graph: baseGraph })
      await call('load_scene', { id: divided.id })
      const split = await call('divide_zone', {
        zoneId,
        cut: [
          [2, 0],
          [2, 4],
        ],
      })
      const afterSplit = await verify(divided.id, divided.version + 1)
      expect(
        Object.values(afterSplit.graph.nodes).filter((node) => node.type === 'zone'),
      ).toHaveLength(2)
      const zoneIds = split.zoneIds as [string, string]
      await call('merge_zones', { zoneIds })
      const afterMerge = await verify(divided.id, divided.version + 2)
      const remainingZones = Object.values(afterMerge.graph.nodes).filter(
        (node) => node.type === 'zone',
      )
      expect(remainingZones).toHaveLength(1)
      await call('delete_zone', { zoneId: remainingZones[0]!.id, contents: 'keep' })
      const afterDelete = await verify(divided.id, divided.version + 3)
      expect(
        Object.values(afterDelete.graph.nodes).filter((node) => node.type === 'zone'),
      ).toHaveLength(0)
      expect(await store.listSceneEvents(divided.id)).toHaveLength(3)
    } finally {
      await client.close()
      await server.close()
      store.close()
      await fs.rm(directory, { recursive: true, force: true })
    }
  })
})
