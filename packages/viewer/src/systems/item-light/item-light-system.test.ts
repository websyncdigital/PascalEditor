import { afterEach, beforeEach, expect, test } from 'bun:test'
import type { AnyNode, AnyNodeId } from '@pascal-app/core'
import { sceneRegistry, useScene } from '@pascal-app/core'
import { useThree } from '@react-three/fiber'
import { act, create } from '@react-three/test-renderer'
import { createElement } from 'react'
import { Group, type PointLight } from 'three'
import { catalogLightSource, useItemLightPool } from '../../store/use-item-light-pool'
import useViewer from '../../store/use-viewer'
import { ItemLightSystem } from './item-light-system'

let previousViewerState = useViewer.getState()

beforeEach(() => {
  previousViewerState = useViewer.getState()
})

afterEach(() => {
  sceneRegistry.clear()
  useItemLightPool.setState({ registrations: new Map(), bakedCanvases: new Set() })
  useScene.setState({ nodes: {} as Record<AnyNodeId, AnyNode> })
  useViewer.setState({
    levelMode: previousViewerState.levelMode,
    selection: previousViewerState.selection,
  })
})

test('batched ceiling lamps stay eligible; all twelve light objects remain visible across toggles and removal', async () => {
  const id = 'item_lamp' as AnyNodeId
  const ceiling = new Group()
  ceiling.layers.set(5)
  const item = new Group()
  ceiling.add(item)
  sceneRegistry.nodes.set(id, item)
  const nodes = {
    site: { id: 'site', type: 'site', visible: false, parentId: null },
    building: { id: 'building', type: 'building', visible: true, parentId: 'site' },
    level: { id: 'level', type: 'level', visible: true, parentId: 'building' },
    ceiling: { id: 'ceiling', type: 'ceiling', visible: true, parentId: 'level' },
    [id]: { id, type: 'item', visible: true, parentId: 'ceiling' },
  } as unknown as Record<AnyNodeId, AnyNode>
  useScene.setState({ nodes })
  useViewer.setState({
    levelMode: 'stacked',
    selection: { ...useViewer.getState().selection, levelId: null },
  })
  let on = true
  const pool = useItemLightPool.getState()
  pool.register({
    key: 'lamp',
    nodeId: id,
    color: '#ffffff',
    distance: 6,
    getWorldPosition: (out) => {
      out.set(1, 2, 3)
      return true
    },
    getIntensity: () => 2,
    isEligible: () => on,
  })
  const renderer = await create(createElement(ItemLightSystem))
  try {
    const lights = renderer.scene
      .findAllByType('PointLight')
      .map((entry) => entry.instance as PointLight)
    expect(lights).toHaveLength(12)
    expect(lights.every((light) => light.visible)).toBe(true)
    await renderer.advanceFrames(5, 1 / 30)
    expect(lights.some((light) => light.intensity > 0)).toBe(true)

    on = false
    await renderer.advanceFrames(30, 1 / 30)
    expect(lights.every((light) => light.intensity === 0 && light.visible)).toBe(true)
    on = true
    await renderer.advanceFrames(5, 1 / 30)
    expect(lights.some((light) => light.intensity > 0)).toBe(true)

    nodes.level!.visible = false
    await renderer.advanceFrames(30, 1 / 30)
    expect(lights.every((light) => light.intensity === 0)).toBe(true)
    nodes.level!.visible = true
    await renderer.advanceFrames(5, 1 / 30)
    expect(lights.some((light) => light.intensity > 0)).toBe(true)

    nodes[id]!.visible = false
    await renderer.advanceFrames(30, 1 / 30)
    expect(lights.every((light) => light.intensity === 0)).toBe(true)
    nodes[id]!.visible = true
    item.layers.set(5)
    await renderer.advanceFrames(30, 1 / 30)
    expect(lights.every((light) => light.intensity === 0)).toBe(true)
    item.layers.set(0)
    ceiling.visible = false
    await renderer.advanceFrames(30, 1 / 30)
    expect(lights.every((light) => light.intensity === 0)).toBe(true)
    ceiling.visible = true
    useViewer.setState({
      levelMode: 'solo',
      selection: { ...useViewer.getState().selection, levelId: 'level_other' },
    })
    await renderer.advanceFrames(30, 1 / 30)
    expect(lights.every((light) => light.intensity === 0)).toBe(true)
    useViewer.setState({
      levelMode: 'stacked',
      selection: { ...useViewer.getState().selection, levelId: null },
    })
    await renderer.advanceFrames(5, 1 / 30)

    pool.register({
      key: 'lamp-next',
      nodeId: id,
      color: '#ff0000',
      distance: 4,
      getWorldPosition: (out) => {
        out.set(4, 5, 6)
        return true
      },
      getIntensity: () => 1,
      isEligible: () => true,
    })
    pool.unregister('lamp')
    await renderer.advanceFrames(30, 1 / 30)
    expect(lights.some((light) => light.intensity > 0)).toBe(true)
    pool.unregister('lamp-next')
    await renderer.advanceFrames(30, 1 / 30)
    expect(lights.every((light) => light.intensity === 0 && light.visible)).toBe(true)
    expect(renderer.scene.findAllByType('PointLight').map((entry) => entry.instance)).toEqual(
      lights,
    )
  } finally {
    await renderer.unmount()
  }
})

test('a baked owner suppresses the native pool on its canvas', async () => {
  let canvas: Group | undefined
  function Fixture() {
    canvas = useThree((state) => state.scene) as Group
    return createElement(ItemLightSystem)
  }
  const renderer = await create(createElement(Fixture))
  try {
    expect(renderer.scene.findAllByType('PointLight')).toHaveLength(12)
    await act(async () => useItemLightPool.getState().setBakedCanvas(canvas!, true))
    expect(renderer.scene.findAllByType('PointLight')).toHaveLength(0)
    await act(async () => useItemLightPool.getState().setBakedCanvas(canvas!, false))
    expect(renderer.scene.findAllByType('PointLight')).toHaveLength(12)
  } finally {
    await renderer.unmount()
  }
})

test('saved lamp state drives a real point light and survives scene-state replacement', async () => {
  const id = 'item_saved_lamp' as AnyNodeId
  const object = new Group()
  sceneRegistry.nodes.set(id, object)
  const lighting = { enabled: true, intensity: 1.6, color: '#ffbb66' }
  const nodes = {
    site: { id: 'site', type: 'site', visible: true, parentId: null },
    building: { id: 'building', type: 'building', visible: true, parentId: 'site' },
    level: { id: 'level', type: 'level', visible: true, parentId: 'building' },
    [id]: { id, type: 'item', visible: true, parentId: 'level', lighting },
  } as unknown as Record<AnyNodeId, AnyNode>
  useScene.setState({ nodes })
  useViewer.setState({ levelMode: 'stacked', selection: { ...useViewer.getState().selection, levelId: null } })
  useItemLightPool.getState().register(catalogLightSource(
    'saved:0', id,
    { kind: 'light', color: '#ffffff', intensityRange: [0, 2], distance: 5, offset: [0, 1, 0] },
    { controls: [{ kind: 'toggle' }], effects: [] },
  ))
  const renderer = await create(createElement(ItemLightSystem))
  try {
    await renderer.advanceFrames(30, 1 / 30)
    const lights = renderer.scene.findAllByType('PointLight').map((entry) => entry.instance as PointLight)
    expect(lights.some((light) => light.intensity > 1 && light.color.getHexString() === 'ffbb66')).toBe(true)
    useScene.setState({ nodes: {
      ...nodes,
      [id]: { ...nodes[id]!, lighting: { enabled: false, intensity: 1.6, color: '#66bbff' } },
    } as Record<AnyNodeId, AnyNode> })
    await renderer.advanceFrames(30, 1 / 30)
    expect(lights.every((light) => light.intensity === 0)).toBe(true)
    useScene.setState({ nodes: {
      ...nodes,
      [id]: { ...nodes[id]!, lighting: { enabled: true, intensity: 0.8, color: '#66bbff' } },
    } as Record<AnyNodeId, AnyNode> })
    await renderer.advanceFrames(30, 1 / 30)
    expect(lights.some((light) => light.intensity > 0.5 && light.color.getHexString() === '66bbff')).toBe(true)
  } finally {
    await renderer.unmount()
  }
})
