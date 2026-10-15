import type { InteriorAssistantService } from '@pascal-app/mcp/assistant'
import { getSceneStore } from './scene-store-server'

const key = Symbol.for('pascal.editor.interior-assistant')
const state = globalThis as typeof globalThis & { [key]?: Promise<InteriorAssistantService> }

export function getInteriorAssistant(): Promise<InteriorAssistantService> {
  state[key] ??= Promise.all([getSceneStore(), getAssistantRuntime()]).then(
    ([store, { InteriorAssistantService }]) => new InteriorAssistantService(store),
  )
  return state[key]
}

export function getAssistantRuntime() {
  // Native loading keeps the headless store out of Next's React client-module transform.
  return import(/* webpackIgnore: true */ '@pascal-app/mcp/assistant')
}
