import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { SceneBridge } from '../bridge/scene-bridge'
import { SqliteSceneStore } from '../storage/sqlite-scene-store'
import type { SceneStore } from '../storage/types'
import type { AssistantOperation, AssistantPlanner } from './contracts'
import { mockPlanner } from './mock-planner'
import { callOperation, graphHash, serialized, withSceneTools } from './runtime'
import { InteriorAssistantService } from './service'

const cleanup: Array<() => Promise<void>> = []
afterEach(async () => {
  for (const dispose of cleanup.splice(0)) await dispose()
})

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'pascal-stage4-test-'))
  const store = new SqliteSceneStore({ databasePath: join(directory, 'pascal.db') })
  cleanup.push(async () => {
    store.close()
    await rm(directory, { recursive: true, force: true })
  })
  const bridge = new SceneBridge()
  bridge.setScene({}, [])
  bridge.loadDefault()
  const level = Object.values(bridge.getNodes()).find((n) => n.type === 'level')!
  const meta = await store.save({ name: 'Assistant test', graph: bridge.exportJSON() })
  let scene = (await store.load(meta.id))!
  await withSceneTools(store, scene, async (client) =>
    callOperation(
      client,
      {
        tool: 'create_room',
        args: {
          levelId: level.id,
          name: 'Study',
          polygon: [
            [0, 0],
            [6, 0],
            [6, 5],
            [0, 5],
          ],
        },
      },
      scene.version,
    ),
  )
  scene = (await store.load(meta.id))!
  const room = Object.values(scene.graph.nodes).find((n) => n.type === 'zone')!
  await withSceneTools(store, scene, async (client) =>
    callOperation(
      client,
      {
        tool: 'place_floor_item',
        args: { catalogItemId: 'floor-lamp', zoneId: room.id, position: [2, 0, 2], rotationY: 0 },
      },
      scene.version,
    ),
  )
  scene = (await store.load(meta.id))!
  const item = Object.values(scene.graph.nodes).find((n) => n.type === 'item')!
  return { store, scene, item, room }
}

const planner = (operation: AssistantOperation): AssistantPlanner => ({
  mode: 'mock',
  plan: async () => ({ message: 'Test proposal', operation }),
})
const signal = () => new AbortController().signal

describe('interior assistant approval and persistence', () => {
  test('preview does not save; one approved light edit persists once, survives reopen and preserves the room', async () => {
    const { store, scene, item } = await fixture()
    const service = new InteriorAssistantService(store)
    const result = await service.propose(
      'owner',
      scene.id,
      scene.version,
      'turn lamp on',
      [],
      mockPlanner,
      signal(),
    )
    expect(result.proposal).not.toBeNull()
    expect((await store.load(scene.id))!.graph).toEqual(scene.graph)
    expect((await store.load(scene.id))!.version).toBe(scene.version)
    const proposal = result.proposal!
    expect(proposal.changes).toHaveLength(1)
    const [first] = await Promise.all([
      service.approve('owner', proposal.id, scene.id, scene.version),
      service.approve('owner', proposal.id, scene.id, scene.version),
    ])
    expect(first.status).toBe('succeeded')
    const saved = (await store.load(scene.id))!
    expect(saved.version).toBe(scene.version + 1)
    expect(saved.graph.nodes[item.id]).toEqual({
      ...scene.graph.nodes[item.id],
      lighting: { enabled: true, intensity: 2, color: '#ffffff' },
    })
    for (const [id, node] of Object.entries(scene.graph.nodes))
      if (id !== item.id)
        expect(saved.graph.nodes[id as keyof typeof saved.graph.nodes]).toEqual(node)
    expect((await service.approve('owner', proposal.id, scene.id, scene.version)).status).toBe(
      'succeeded',
    )
    expect((await store.load(scene.id))!.version).toBe(saved.version)
    const reopened = new SceneBridge()
    reopened.loadJSON(saved.graph)
    expect(reopened.validateScene().valid).toBe(true)
  })

  test('rejects unknown assets, no-op lights, unsupported commands and ambiguous targets without a save', async () => {
    const { store, scene, room, item } = await fixture()
    const service = new InteriorAssistantService(store)
    const propose = (text: string, p = mockPlanner) =>
      service.propose('owner', scene.id, scene.version, text, [], p, signal())
    expect((await propose('make it beautiful')).proposal).toBeNull()
    expect((await propose('turn missing off')).proposal).toBeNull()
    await expect(propose('turn lamp off')).rejects.toThrow('unchanged')
    await expect(
      propose(
        'add',
        planner({
          tool: 'place_floor_item',
          args: { catalogItemId: 'invented', zoneId: room.id, position: [3, 0, 2], rotationY: 0 },
        }),
      ),
    ).rejects.toThrow('Unsupported')
    await expect(
      propose(
        'move',
        planner({
          tool: 'edit_floor_item',
          args: { itemId: item.id, zoneId: room.id, position: [100, 0, 100], rotationY: null },
        }),
      ),
    ).rejects.toThrow('outside')
    await expect(
      propose('raw edit', {
        mode: 'mock',
        plan: async () => ({
          message: 'bad',
          operation: { tool: 'apply_patch', args: {} } as never,
        }),
      }),
    ).rejects.toThrow()
    const context = {
      scene: { id: 'x', name: 'x', version: 1 },
      selectedIds: [],
      assets: [],
      finishes: { floor: [], wall: [] },
      nodes: [
        { id: 'item_a', type: 'item', asset: { id: 'floor-lamp' } },
        { id: 'item_b', type: 'item', asset: { id: 'floor-lamp' } },
      ],
    }
    expect((await mockPlanner.plan('turn lamp on', context, signal())).message).toContain(
      'Choose one',
    )
    expect((await store.load(scene.id))!.graph).toEqual(scene.graph)
    expect((await store.load(scene.id))!.version).toBe(scene.version)
  })

  test('enforces session ownership, rejection, expiry, scene identity and stale versions', async () => {
    const { store, scene } = await fixture()
    let now = 0
    const service = new InteriorAssistantService(store, () => now)
    const propose = async () =>
      (
        await service.propose(
          'owner',
          scene.id,
          scene.version,
          'turn lamp on',
          [],
          mockPlanner,
          signal(),
        )
      ).proposal!
    const p = await propose()
    await expect(service.approve('other', p.id, scene.id, scene.version)).rejects.toThrow(
      'unavailable',
    )
    await expect(service.approve('owner', p.id, 'wrong-scene', scene.version)).rejects.toThrow(
      'another scene',
    )
    service.cancel('owner', p.id)
    expect((await service.approve('owner', p.id, scene.id, scene.version)).status).toBe('cancelled')
    const expiring = await propose()
    now = 600_001
    await expect(service.approve('owner', expiring.id, scene.id, scene.version)).rejects.toThrow(
      'expired',
    )
    const stale = await propose()
    await store.save({
      id: scene.id,
      name: 'Manual save',
      graph: scene.graph,
      expectedVersion: scene.version,
    })
    expect((await service.approve('owner', stale.id, scene.id, scene.version)).status).toBe(
      'conflict',
    )
    expect((await store.load(scene.id))!.graph).toEqual(scene.graph)
  })

  test('cancelled planning and queued execution do not mutate', async () => {
    const { store, scene } = await fixture()
    const service = new InteriorAssistantService(store)
    const abort = new AbortController()
    abort.abort()
    await expect(
      service.propose(
        'owner',
        scene.id,
        scene.version,
        'turn lamp on',
        [],
        mockPlanner,
        abort.signal,
      ),
    ).rejects.toThrow()
    const p = (
      await service.propose(
        'owner',
        scene.id,
        scene.version,
        'turn lamp on',
        [],
        mockPlanner,
        signal(),
      )
    ).proposal!
    let unblock!: () => void
    const waiting = serialized(
      () =>
        new Promise<void>((resolve) => {
          unblock = resolve
        }),
    )
    await new Promise((resolve) => setTimeout(resolve, 0))
    const approval = service.approve('owner', p.id, scene.id, scene.version)
    service.cancel('owner', p.id)
    unblock()
    await waiting
    expect((await approval).status).toBe('cancelled')
    expect((await store.load(scene.id))!.version).toBe(scene.version)
  })

  test('distinguishes rejected saves from persisted changes with failed event publication', async () => {
    for (const failing of ['save', 'appendSceneEvent'] as const) {
      const { store, scene } = await fixture()
      const wrapper = new Proxy(store, {
        get(target, key) {
          if (key === failing)
            return async () => {
              throw new Error('Injected failure')
            }
          const value = Reflect.get(target, key)
          return typeof value === 'function' ? value.bind(target) : value
        },
      }) as SceneStore
      const service = new InteriorAssistantService(wrapper)
      const p = (
        await service.propose(
          'owner',
          scene.id,
          scene.version,
          'turn lamp on',
          [],
          mockPlanner,
          signal(),
        )
      ).proposal!
      const result = await service.approve('owner', p.id, scene.id, scene.version)
      expect(result.status).toBe(failing === 'save' ? 'failed' : 'saved_with_warning')
      expect((await store.load(scene.id))!.version).toBe(
        scene.version + (failing === 'save' ? 0 : 1),
      )
    }
  })

  test('prevents a second proposal overwriting an approved edit', async () => {
    const { store, scene } = await fixture()
    const service = new InteriorAssistantService(store)
    const propose = () =>
      service.propose('owner', scene.id, scene.version, 'turn lamp on', [], mockPlanner, signal())
    const [a, b] = await Promise.all([propose(), propose()])
    const results = await Promise.all([
      service.approve('owner', a.proposal!.id, scene.id, scene.version),
      service.approve('owner', b.proposal!.id, scene.id, scene.version),
    ])
    expect(results.map((r) => r.status)).toEqual(['succeeded', 'conflict'])
    expect((await store.load(scene.id))!.version).toBe(scene.version + 1)
    expect(graphHash((await store.load(scene.id))!.graph)).not.toBe(graphHash(scene.graph))
  })

  test('serializes two different saved scenes without crossing their node graphs', async () => {
    const first = await fixture()
    const second = await fixture()
    const a = new InteriorAssistantService(first.store)
    const b = new InteriorAssistantService(second.store)
    const [pa, pb] = await Promise.all([
      a.propose(
        'a',
        first.scene.id,
        first.scene.version,
        'turn lamp on',
        [],
        mockPlanner,
        signal(),
      ),
      b.propose(
        'b',
        second.scene.id,
        second.scene.version,
        'set lamp intensity to 1.2',
        [],
        mockPlanner,
        signal(),
      ),
    ])
    const results = await Promise.all([
      a.approve('a', pa.proposal!.id, first.scene.id, first.scene.version),
      b.approve('b', pb.proposal!.id, second.scene.id, second.scene.version),
    ])
    expect(results.map((r) => r.status)).toEqual(['succeeded', 'succeeded'])
    expect(Object.keys((await first.store.load(first.scene.id))!.graph.nodes)).toEqual(
      Object.keys(first.scene.graph.nodes),
    )
    expect(Object.keys((await second.store.load(second.scene.id))!.graph.nodes)).toEqual(
      Object.keys(second.scene.graph.nodes),
    )
  })

  test('a manual save racing the tool persistence remains intact and is never reported as assistant success', async () => {
    const { store, scene, item } = await fixture()
    const manualGraph = structuredClone(scene.graph)
    manualGraph.nodes[item.id]!.name = 'Manual edit wins'
    const wrapper = new Proxy(store, {
      get(target, key) {
        if (key === 'save')
          return async (options: Parameters<SceneStore['save']>[0]) => {
            await store.save({
              id: scene.id,
              name: scene.name,
              graph: manualGraph,
              expectedVersion: scene.version,
            })
            return store.save(options)
          }
        const value = Reflect.get(target, key)
        return typeof value === 'function' ? value.bind(target) : value
      },
    }) as SceneStore
    const service = new InteriorAssistantService(wrapper)
    const p = (
      await service.propose('a', scene.id, scene.version, 'turn lamp on', [], mockPlanner, signal())
    ).proposal!
    expect((await service.approve('a', p.id, scene.id, scene.version)).status).toBe('conflict')
    expect((await store.load(scene.id))!.graph).toEqual(manualGraph)
  })

  test('furniture, materials and room operations use the validated tools and survive storage reload', async () => {
    const { store, scene, item } = await fixture()
    const service = new InteriorAssistantService(store)
    for (const prompt of [
      'move selected by 0.10 m on x',
      'rotate selected by 15 degrees',
      'set Study floor material to concrete-polished',
      'move room Study by 0.1, 0',
      'delete selected',
    ]) {
      const before = (await store.load(scene.id))!
      const p = (
        await service.propose(
          'owner',
          scene.id,
          before.version,
          prompt,
          [item.id],
          mockPlanner,
          signal(),
        )
      ).proposal!
      expect((await store.load(scene.id))!.graph).toEqual(before.graph)
      const saved = await service.approve('owner', p.id, scene.id, before.version)
      expect(saved.status).toBe('succeeded')
      expect((await store.load(scene.id))!.version).toBe(before.version + 1)
    }
    const saved = (await store.load(scene.id))!
    expect(saved.graph.nodes[item.id]).toBeUndefined()
    const bridge = new SceneBridge()
    bridge.loadJSON(saved.graph)
    expect(bridge.validateScene().valid).toBe(true)
  })
})
