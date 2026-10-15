import { afterEach, expect, test } from 'bun:test'
import { type AnyNode, ItemNode, toggleMechanism, useInteractive, useScene } from '@pascal-app/core'
import { itemDefinition } from '../item/definition'
import { proceduralItemDefinition } from '../procedural-item/definition'
import {
  itemHasLights,
  itemLightsOn,
  itemMechanism,
  proceduralMechanism,
  toggleItemLights,
} from './item-interactions'

const catalogItem = (id: string, interactive: unknown) =>
  ({ id, type: 'item', asset: { interactive } }) as unknown as AnyNode

const proceduralItem = (id: string, parts: unknown[]) =>
  ({ id, type: 'procedural-item', recipe: { parts } }) as unknown as AnyNode

const ids: string[] = []
afterEach(() => {
  const state = useInteractive.getState()
  for (const id of ids.splice(0)) {
    state.removeItem(id as never)
    state.removeProcedural(id as never)
  }
  useScene.setState({ nodes: {} as never })
})

test('item and procedural item declare their mechanisms through the registry capability', () => {
  expect(itemDefinition.capabilities.mechanism).toBe(itemMechanism)
  expect(proceduralItemDefinition.capabilities.mechanism).toBe(proceduralMechanism)
})

test('a catalog lamp with an animated part splits its first toggle off as the light', () => {
  const node = catalogItem('item_lamp_fan', {
    controls: [{ kind: 'toggle' }, { kind: 'toggle' }],
    effects: [
      { kind: 'light', color: '#fff', intensityRange: [0, 1], offset: [0, 0, 0] },
      { kind: 'animation', clips: { on: 'Spin' } },
    ],
  })
  ids.push(node.id)
  expect(itemHasLights(node)).toBe(true)
  expect(itemMechanism.has(node)).toBe(true)

  toggleMechanism(itemMechanism, node)
  expect(useInteractive.getState().items[node.id as never]?.controlValues).toEqual([false, true])
  expect(itemMechanism.isOn(node, useInteractive.getState())).toBe(true)
  expect(itemLightsOn(node, useInteractive.getState())).toBe(false)

  toggleItemLights(node)
  expect(useInteractive.getState().items[node.id as never]?.controlValues).toEqual([true, true])

  toggleMechanism(itemMechanism, node)
  expect(useInteractive.getState().items[node.id as never]?.controlValues).toEqual([true, false])
})

test('a catalog item without an animation effect has no mechanisms', () => {
  const node = catalogItem('item_plain_lamp', {
    controls: [{ kind: 'toggle' }, { kind: 'slider', label: 'Intensity', min: 0, max: 1 }],
    effects: [{ kind: 'light', color: '#fff', intensityRange: [0, 1], offset: [0, 0, 0] }],
  })
  expect(itemMechanism.has(node)).toBe(false)
  expect(itemHasLights(node)).toBe(true)
})

test('procedural motion parts toggle together: any running stops all, else starts all', () => {
  const node = proceduralItem('procedural_cabinet', [
    { id: 'door', motion: { kind: 'hinge' } },
    { id: 'drawer', motion: { kind: 'slide' } },
    { id: 'bulb', light: {} },
  ])
  ids.push(node.id)
  expect(proceduralMechanism.has(node)).toBe(true)
  expect(itemHasLights(node)).toBe(true)

  useInteractive.getState().setProceduralParts(node.id as never, ['door'], true)
  toggleMechanism(proceduralMechanism, node)
  expect(useInteractive.getState().procedural[node.id as never]?.parts).toEqual({
    door: false,
    drawer: false,
  })
  toggleMechanism(proceduralMechanism, node)
  expect(proceduralMechanism.isOn(node, useInteractive.getState())).toBe(true)

  const lit = itemLightsOn(node, useInteractive.getState())
  toggleItemLights(node)
  expect(itemLightsOn(node, useInteractive.getState())).toBe(!lit)
})

test('a light-only procedural item has no mechanism', () => {
  const node = proceduralItem('procedural_pendant', [{ id: 'bulb', light: {} }])
  expect(proceduralMechanism.has(node)).toBe(false)
  expect(itemHasLights(node)).toBe(true)
})

test('the selected catalog lamp switch updates saved item lighting', () => {
  const previousRequestAnimationFrame = globalThis.requestAnimationFrame
  const previousCancelAnimationFrame = globalThis.cancelAnimationFrame
  globalThis.requestAnimationFrame = (() => 1) as typeof requestAnimationFrame
  globalThis.cancelAnimationFrame = (() => {}) as typeof cancelAnimationFrame
  try {
  const node = ItemNode.parse({
    parentId: null,
    asset: {
      id: 'floor-lamp', name: 'Floor Lamp', category: 'furniture',
      thumbnail: '', src: '/items/floor-lamp/model.glb',
      interactive: {
        controls: [{ kind: 'toggle' }],
        effects: [{ kind: 'light', color: '#ffffff', intensityRange: [0, 2], offset: [0, 1, 0] }],
      },
    },
  })
  useScene.setState({ nodes: { [node.id]: node } as never })
  toggleItemLights(node)
  const lit = useScene.getState().nodes[node.id]
  expect(lit?.type === 'item' && lit.lighting).toEqual({
    enabled: true, intensity: 2, color: '#ffffff',
  })
  if (!lit) throw new Error('Lamp disappeared')
  toggleItemLights(lit)
  const off = useScene.getState().nodes[node.id]
  expect(off?.type === 'item' && off.lighting?.enabled).toBe(false)
  } finally {
    globalThis.requestAnimationFrame = previousRequestAnimationFrame
    globalThis.cancelAnimationFrame = previousCancelAnimationFrame
  }
})
