import { describe, expect, test } from 'bun:test'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { MATERIAL_CATALOG } from '@pascal-app/core'
import { SceneBridge } from '../bridge/scene-bridge'
import { createPascalMcpServer } from '../server'
import { SqliteSceneStore } from '../storage/sqlite-scene-store'

describe('saved room finish operations', () => {
  test('discovers compatible materials and persists floor and wall finishes without changing geometry', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'pascal-stage3c-finishes-'))
    const databasePath = path.join(directory, 'pascal.db')
    const store = new SqliteSceneStore({ databasePath })
    const bridge = new SceneBridge()
    bridge.setScene({}, [])
    bridge.loadDefault()
    const server = createPascalMcpServer({ bridge, store })
    const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair()
    const client = new Client({ name: 'finish-persistence-test', version: '1' })
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
      const floorSearch = await good('search_finish_materials', {
        surface: 'floor',
        query: 'polished',
      })
      expect(floorSearch.materials).toContainEqual({
        id: 'concrete-polished',
        label: 'Polished Concrete',
        category: 'concrete',
      })
      expect((await good('search_finish_materials', { surface: 'floor', query: 'finewood' })).materials).toEqual([])
      const wallSearch = await good('search_finish_materials', {
        surface: 'wall',
        query: 'drywall',
      })
      expect((wallSearch.materials as Array<{ id: string }>).some(({ id }) => id === 'concrete-drywall')).toBe(true)
      const incompatibleSearch = await good('search_finish_materials', {
        surface: 'floor',
        query: 'concrete-drywall',
      })
      expect(incompatibleSearch.materials).toEqual([])
      for (const surface of ['floor', 'wall'] as const) {
        for (const query of ['', 'concrete', 'siding']) {
          const listed = await good('search_finish_materials', { surface, query, limit: 50 })
          for (const { id } of listed.materials as Array<{ id: string }>) {
            const material = MATERIAL_CATALOG.find((item) => item.id === id)!
            for (const url of Object.values(material.preset?.maps ?? {})) {
              if (url?.startsWith('/')) {
                const asset = path.resolve(import.meta.dir, '../../../../apps/editor/public', url.slice(1))
                expect(await fs.stat(asset).then((entry) => entry.isFile()).catch(() => false)).toBe(true)
              }
            }
          }
        }
      }

      const level = Object.values(bridge.getNodes()).find((node) => node.type === 'level')!
      const room = await good('create_room', {
        levelId: level.id,
        name: 'Materials test room',
        polygon: [
          [0, 0],
          [6, 0],
          [6, 5],
          [0, 5],
        ],
      })
      const zoneId = room.zoneId as string
      const saved = await store.save({ name: 'Disposable material room', graph: bridge.exportJSON() })
      await good('load_scene', { id: saved.id })
      const baseline = (await store.load(saved.id))!

      await bad('set_room_finish', {
        zoneId: 'zone_missing', surface: 'floor', catalogMaterialId: 'wood-finewood27', expectedVersion: 1,
      })
      await bad('set_room_finish', {
        zoneId, surface: 'floor', catalogMaterialId: 'missing-material', expectedVersion: 1,
      })
      await bad('set_room_finish', {
        zoneId, surface: 'floor', catalogMaterialId: 'concrete-drywall', expectedVersion: 1,
      })
      await bad('set_room_finish', {
        zoneId, surface: 'floor', catalogMaterialId: 'wood-finewood27', expectedVersion: 1,
      })
      expect((await store.load(saved.id))?.version).toBe(1)

      const floor = await good('set_room_finish', {
        zoneId, surface: 'floor', catalogMaterialId: 'concrete-polished', expectedVersion: 1,
      })
      expect(floor).toMatchObject({
        zoneId, surface: 'floor', materialRef: 'library:concrete-polished', sceneId: saved.id, version: 2,
      })
      const afterFloor = (await store.load(saved.id))!
      expect(afterFloor.graph.nodes[zoneId]).toMatchObject({
        floor: { finish: 'library:concrete-polished' },
      })
      await bad('set_room_finish', {
        zoneId, surface: 'floor', catalogMaterialId: 'concrete-polished', expectedVersion: 2,
      })
      await bad('set_room_finish', {
        zoneId, surface: 'wall', catalogMaterialId: 'concrete-drywall', expectedVersion: 1,
      })
      expect((await store.load(saved.id))?.version).toBe(2)

      const wall = await good('set_room_finish', {
        zoneId, surface: 'wall', catalogMaterialId: 'concrete-drywall', expectedVersion: 2,
      })
      expect(wall).toMatchObject({
        zoneId, surface: 'wall', materialRef: 'library:concrete-drywall', sceneId: saved.id, version: 3,
      })
      const final = (await store.load(saved.id))!
      expect(final.graph.nodes[zoneId]).toMatchObject({
        floor: { finish: 'library:concrete-polished' },
        wallMaterial: 'library:concrete-drywall',
      })
      const { floor: beforeFloor, wallMaterial: beforeWall, ...unchangedZone } = baseline.graph.nodes[zoneId] as Record<string, unknown>
      const { floor: finalFloor, wallMaterial: finalWall, ...finalZone } = final.graph.nodes[zoneId] as Record<string, unknown>
      expect(finalZone).toEqual(unchangedZone)
      for (const [id, node] of Object.entries(baseline.graph.nodes)) {
        if (id !== zoneId) expect(final.graph.nodes[id]).toEqual(node)
      }
      expect(Object.keys(final.graph.nodes)).toEqual(Object.keys(baseline.graph.nodes))
      expect(bridge.validateScene().valid).toBe(true)
      expect(await store.listSceneEvents(saved.id)).toHaveLength(2)
      const restartedStore = new SqliteSceneStore({ databasePath })
      try {
        const reopened = (await restartedStore.load(saved.id))!
        expect(reopened.version).toBe(3)
        expect(reopened.graph).toEqual(final.graph)
        const freshBridge = new SceneBridge()
        freshBridge.loadJSON(reopened.graph)
        expect(freshBridge.validateScene().valid).toBe(true)
      } finally {
        restartedStore.close()
      }

      const currentZone = bridge.getNode(zoneId as never)!
      if (currentZone.type !== 'zone') throw new Error('Review room disappeared')
      bridge.updateNode(currentZone.id, {
        floor: {
          ...currentZone.floor,
          regions: [{
            id: 'floor_region_review',
            polygon: [[1, 1], [2, 1], [2, 2], [1, 2]],
            finish: 'library:wood-finewood27',
          }],
        },
      })
      await bad('set_room_finish', {
        zoneId, surface: 'floor', catalogMaterialId: 'wood-hungarianparquet2', expectedVersion: 3,
      })
      bridge.updateNode(currentZone.id, {
        wallOverrides: [{ wallId: currentZone.boundaryWallIds[0]!, face: 'a', finish: 'library:wood-finewood27' }],
      })
      await bad('set_room_finish', {
        zoneId, surface: 'wall', catalogMaterialId: 'wood-finewood27', expectedVersion: 3,
      })
      bridge.updateNode(currentZone.id, { hasFloor: false })
      await bad('set_room_finish', {
        zoneId, surface: 'floor', catalogMaterialId: 'wood-hungarianparquet2', expectedVersion: 3,
      })
      expect((await store.load(saved.id))?.graph).toEqual(final.graph)

      await store.save({
        id: saved.id,
        name: saved.name,
        graph: final.graph,
        expectedVersion: 3,
      })
      await bad('set_room_finish', {
        zoneId, surface: 'wall', catalogMaterialId: 'wood-finewood27', expectedVersion: 3,
      })
      expect((await store.load(saved.id))?.version).toBe(4)
    } finally {
      await client.close()
      await server.close()
      store.close()
      await fs.rm(directory, { recursive: true, force: true })
    }
  })
})
