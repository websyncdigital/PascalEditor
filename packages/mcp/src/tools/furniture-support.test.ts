import { afterEach, expect, test } from 'bun:test'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ItemNode, SlabNode as Slab } from '@pascal-app/core/schema'
import { LevelNode, SlabNode } from '@pascal-app/core/schema'
import { mockPlanner } from '../assistant/mock-planner'
import { callOperation, withSceneTools } from '../assistant/runtime'
import { InteriorAssistantService } from '../assistant/service'
import { SceneBridge } from '../bridge/scene-bridge'
import { SqliteSceneStore } from '../storage/sqlite-scene-store'

const stores: SqliteSceneStore[] = []
afterEach(() => {
  for (const store of stores.splice(0)) store.close()
})

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'pascal-floor-support-'))
  const databasePath = join(directory, 'pascal.db')
  const store = new SqliteSceneStore({ databasePath })
  stores.push(store)
  const bridge = new SceneBridge()
  bridge.setScene({}, [])
  bridge.loadDefault()
  const level = Object.values(bridge.getNodes()).find((node) => node.type === 'level')!
  const meta = await store.save({
    name: 'Disposable support acceptance',
    graph: bridge.exportJSON(),
  })
  let scene = (await store.load(meta.id))!
  await withSceneTools(store, scene, (client) =>
    callOperation(
      client,
      {
        tool: 'create_room',
        args: {
          levelId: level.id,
          name: 'Living room',
          polygon: [
            [0, 0],
            [10, 0],
            [10, 8],
            [0, 8],
          ],
        },
      },
      scene.version,
    ),
  )
  scene = (await store.load(meta.id))!
  const room = Object.values(scene.graph.nodes).find((node) => node.type === 'zone')!
  await withSceneTools(store, scene, (client) =>
    callOperation(
      client,
      {
        tool: 'place_floor_item',
        args: {
          catalogItemId: 'coffee-table',
          zoneId: room.id,
          position: [3, 0.25, 3],
          rotationY: 0,
        },
      },
      scene.version,
    ),
  )
  scene = (await store.load(meta.id))!
  const table = Object.values(scene.graph.nodes).find(
    (node): node is ItemNode => node.type === 'item',
  )!
  const slab = SlabNode.parse({
    parentId: level.id,
    polygon: [
      [1, 1],
      [7, 1],
      [7, 7],
      [1, 7],
    ],
    elevation: 0.5,
  })
  bridge.loadJSON(scene.graph)
  const otherLevel = LevelNode.parse({ parentId: level.parentId, level: 1, height: 2.5 })
  bridge.createNode(otherLevel, level.parentId!)
  bridge.createNode(slab, level.id)
  bridge.updateNode(table.id, { supportSlabId: slab.id, metadata: { review: 'keep' } })
  await store.save({
    id: scene.id,
    name: scene.name,
    graph: bridge.exportJSON(),
    expectedVersion: scene.version,
  })
  scene = (await store.load(scene.id))!
  return {
    store,
    databasePath,
    scene,
    room,
    table: scene.graph.nodes[table.id] as ItemNode,
    slab,
    otherLevel,
  }
}

test('approved slab-supported move and rotation preserve support, offset, other nodes and SQLite reload', async () => {
  const { store, databasePath, scene, table } = await fixture()
  const service = new InteriorAssistantService(store)
  let current = scene
  for (const [prompt, position, rotation] of [
    ['move selected by 0.10 m on x', [3.1, 0.25, 3], [0, 0, 0]],
    ['rotate selected by 90 degrees', [3.1, 0.25, 3], [0, Math.PI / 2, 0]],
  ] as const) {
    const before = current
    const planned = await service.propose(
      'owner',
      scene.id,
      before.version,
      prompt,
      [table.id],
      mockPlanner,
      new AbortController().signal,
    )
    expect(planned.proposal).not.toBeNull()
    expect(await store.load(scene.id)).toEqual(before)
    await expect(
      service.approve('another-owner', planned.proposal!.id, scene.id, before.version),
    ).rejects.toThrow('unavailable')
    const approved = await service.approve('owner', planned.proposal!.id, scene.id, before.version)
    expect(approved.status, approved.result?.message).toBe('succeeded')
    current = (await store.load(scene.id))!
    expect(current.version).toBe(before.version + 1)
    expect(current.graph.nodes[table.id]).toEqual({
      ...table,
      position: [...position],
      rotation: [...rotation],
    })
    for (const [id, node] of Object.entries(scene.graph.nodes))
      if (id !== table.id) expect(current.graph.nodes[id]).toEqual(node)
    await service.approve('owner', planned.proposal!.id, scene.id, before.version)
    expect(await store.load(scene.id)).toEqual(current)
  }
  const reopened = new SqliteSceneStore({ databasePath })
  stores.push(reopened)
  expect((await reopened.load(scene.id))!.graph).toEqual(current.graph)
  const loaded = new SceneBridge()
  loaded.loadJSON(current.graph)
  expect(loaded.validateScene().valid).toBe(true)
})

test('a stale slab-supported proposal cannot overwrite a later edit', async () => {
  const { store, scene, table } = await fixture()
  const service = new InteriorAssistantService(store)
  const planned = await service.propose(
    'owner',
    scene.id,
    scene.version,
    'move selected by 0.10 m on x',
    [table.id],
    mockPlanner,
    new AbortController().signal,
  )
  const graph = structuredClone(scene.graph)
  Object.assign(graph.nodes[table.id]!, { name: 'Later manual name' })
  await store.save({ id: scene.id, name: scene.name, graph, expectedVersion: scene.version })
  const before = (await store.load(scene.id))!
  const result = await service.approve('owner', planned.proposal!.id, scene.id, scene.version)
  expect(result.status).toBe('conflict')
  expect(result.result?.message).toContain('scene changed')
  expect(await store.load(scene.id)).toEqual(before)
})

const invalidCases: Array<{
  name: string
  change?: (table: ItemNode, slab: Slab, otherLevelId: string) => void
  position?: [number, number, number]
  rotationY?: number
  message: string
}> = [
  {
    name: 'missing support',
    change: (table) => {
      table.supportSlabId = 'slab_missing'
    },
    message: 'slab support on its level',
  },
  {
    name: 'non-slab support',
    change: (table) => {
      table.supportSlabId = table.parentId!
    },
    message: 'slab support on its level',
  },
  {
    name: 'support on another level',
    change: (_, slab, otherLevelId) => {
      slab.parentId = otherLevelId as Slab['parentId']
    },
    message: 'slab support on its level',
  },
  {
    name: 'ground sentinel remains outside this scope',
    change: (table) => {
      table.supportSlabId = 'ground'
    },
    message: 'slab support on its level',
  },
  {
    name: 'invalid item parent',
    change: (table, slab) => {
      table.parentId = slab.id
    },
    message: 'unsupported parent',
  },
  {
    name: 'current footprint no longer on host',
    change: (_, slab) => {
      slab.polygon = [
        [6, 6],
        [8, 6],
        [8, 8],
        [6, 8],
      ]
    },
    message: 'support slab',
  },
  { name: 'move beyond slab while inside room', position: [7.1, 0.25, 3], message: 'support slab' },
  { name: 'move touching slab edge', position: [2, 0.25, 3], message: 'support slab' },
  {
    name: 'hole inside proposed footprint',
    change: (_, slab) => {
      slab.holes = [
        [
          [4.2, 2.8],
          [4.4, 2.8],
          [4.4, 3.2],
          [4.2, 3.2],
        ],
      ]
    },
    position: [4, 0.25, 3],
    message: 'support slab',
  },
  {
    name: 'rotation crossing slab edge',
    change: (_, slab) => {
      slab.polygon = [
        [1, 2.2],
        [7, 2.2],
        [7, 7],
        [1, 7],
      ]
    },
    rotationY: Math.PI / 2,
    message: 'support slab',
  },
  {
    name: 'concave support notch crossing the footprint',
    change: (_, slab) => {
      slab.polygon = [
        [1, 1],
        [7, 1],
        [7, 7],
        [4.7, 7],
        [4.7, 2.8],
        [4.5, 2.8],
        [4.5, 7],
        [1, 7],
      ]
    },
    position: [4.6, 0.25, 3],
    message: 'support slab',
  },
  {
    name: 'vertical offset change',
    position: [3.1, 0.5, 3],
    message: 'preserve the item Y offset',
  },
]

for (const scenario of invalidCases) {
  test(`refuses ${scenario.name} without saving`, async () => {
    const { store, scene, table, slab, room, otherLevel } = await fixture()
    const graph = structuredClone(scene.graph)
    scenario.change?.(
      graph.nodes[table.id] as ItemNode,
      graph.nodes[slab.id] as Slab,
      otherLevel.id,
    )
    await store.save({ id: scene.id, name: scene.name, graph, expectedVersion: scene.version })
    const before = (await store.load(scene.id))!
    const events = await store.listSceneEvents(scene.id)
    await expect(
      withSceneTools(store, before, (client) =>
        callOperation(
          client,
          {
            tool: 'edit_floor_item',
            args: {
              itemId: table.id,
              zoneId: room.id,
              position:
                scenario.rotationY === undefined ? (scenario.position ?? [3.1, 0.25, 3]) : null,
              rotationY: scenario.rotationY ?? null,
            },
          },
          before.version,
        ),
      ),
    ).rejects.toThrow(scenario.message)
    expect(await store.load(scene.id)).toEqual(before)
    expect(await store.listSceneEvents(scene.id)).toEqual(events)
  })
}

test('slab-supported furniture still respects collision, room and deletion boundaries', async () => {
  const { store, scene, table, room } = await fixture()
  await withSceneTools(store, scene, (client) =>
    callOperation(
      client,
      {
        tool: 'place_floor_item',
        args: { catalogItemId: 'dining-chair', zoneId: room.id, position: [5, 0, 3], rotationY: 0 },
      },
      scene.version,
    ),
  )
  const before = (await store.load(scene.id))!
  await expect(
    withSceneTools(store, before, (client) =>
      callOperation(
        client,
        {
          tool: 'edit_floor_item',
          args: { itemId: table.id, zoneId: room.id, position: [4.9, 0.25, 3], rotationY: null },
        },
        before.version,
      ),
    ),
  ).rejects.toThrow('overlap')
  await expect(
    withSceneTools(store, before, (client) =>
      callOperation(
        client,
        {
          tool: 'edit_floor_item',
          args: {
            itemId: table.id,
            zoneId: 'zone_missing',
            position: [3.1, 0.25, 3],
            rotationY: null,
          },
        },
        before.version,
      ),
    ),
  ).rejects.toThrow('Room not found')
  await expect(
    withSceneTools(store, before, (client) =>
      callOperation(
        client,
        {
          tool: 'delete_floor_item',
          args: { itemId: table.id },
        },
        before.version,
      ),
    ),
  ).rejects.toThrow('pinned support')
  expect(await store.load(scene.id)).toEqual(before)
})
