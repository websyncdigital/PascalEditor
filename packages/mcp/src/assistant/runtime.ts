import { createHash } from 'node:crypto'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import type { SceneGraph } from '@pascal-app/core/clone-scene-graph'
import { SceneBridge } from '../bridge/scene-bridge'
import { createPascalMcpServer } from '../server'
import type { SceneStore, SceneWithGraph } from '../storage/types'
import { SceneVersionConflictError } from '../storage/types'
import type { AssistantOperation } from './contracts'

const allowed = new Set([
  'create_room',
  'move_zone',
  'place_floor_item',
  'edit_floor_item',
  'delete_floor_item',
  'set_room_finish',
  'configure_item_light',
  'search_finish_materials',
])
const queueKey = Symbol.for('pascal.assistant.scene-queue')
const processState = globalThis as typeof globalThis & { [queueKey]?: Promise<unknown> }

export function graphHash(graph: SceneGraph): string {
  return createHash('sha256').update(JSON.stringify(graph)).digest('hex')
}

// SceneBridge uses core's process-wide store, so even different scenes must serialize.
export function serialized<T>(work: () => Promise<T>): Promise<T> {
  const next = (processState[queueKey] ?? Promise.resolve()).catch(() => {}).then(work)
  processState[queueKey] = next.catch(() => {})
  return next
}

export async function withSceneTools<T>(
  store: SceneStore,
  scene: SceneWithGraph,
  work: (client: Client, bridge: SceneBridge) => Promise<T>,
): Promise<T> {
  const bridge = new SceneBridge()
  const running = new Set<Promise<unknown>>()
  bridge.loadJSON(scene.graph)
  bridge.setActiveScene(scene)
  const server = createPascalMcpServer({
    bridge,
    store,
    executeTool: async ({ name, execute }) => {
      if (!allowed.has(name)) throw new Error('Assistant tool is not allowed')
      const task = execute()
      running.add(task)
      try {
        return await task
      } finally {
        running.delete(task)
      }
    },
  })
  const client = new Client({ name: 'pascal-interior-assistant', version: '1' })
  const [a, b] = InMemoryTransport.createLinkedPair()
  try {
    await Promise.all([server.connect(a), client.connect(b)])
    return await work(client, bridge)
  } finally {
    // A timeout must not release the global scene lock while its save is still running.
    await Promise.allSettled([...running])
    await client.close()
    await server.close()
  }
}

export async function callOperation(
  client: Client,
  operation: AssistantOperation,
  version: number,
) {
  const args = Object.fromEntries(
    Object.entries(operation.args).filter(([, value]) => value !== null),
  )
  const result = await client.callTool(
    { name: operation.tool, arguments: { ...args, expectedVersion: version } },
    undefined,
    { timeout: 30_000 },
  )
  if (result.isError) {
    const message = (result.content as Array<{ type: string; text?: string }>)
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join(' ')
    throw new Error(message || 'Scene tool refused the operation')
  }
  return result
}

// The same tools run against a disposable snapshot during proposal validation.
// No callback on this adapter can write to the real scene store.
export function previewStore(initial: SceneWithGraph): SceneStore {
  let scene = structuredClone(initial)
  const unsupported = async (): Promise<never> => {
    throw new Error('Unsupported preview operation')
  }
  return {
    backend: 'sqlite',
    load: async (id) => (id === scene.id ? structuredClone(scene) : null),
    list: async () => [scene],
    delete: unsupported,
    rename: unsupported,
    save: async (options) => {
      if (options.id !== scene.id || options.expectedVersion !== scene.version)
        throw new SceneVersionConflictError()
      scene = {
        ...scene,
        version: scene.version + 1,
        graph: structuredClone(options.graph),
        graphHash: graphHash(options.graph),
      }
      return scene
    },
    appendSceneEvent: async (event) => ({
      ...event,
      eventId: 1,
      createdAt: new Date().toISOString(),
    }),
  }
}
