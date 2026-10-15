import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import type { SceneGraph } from '@pascal-app/core/clone-scene-graph'
import type { AnyNodeId } from '@pascal-app/core/schema'
import { assistantOperationSchema } from './contracts'
import type { DesignAlternative, DesignRequest, DesignStep } from './design-contracts'
import { callOperation } from './runtime'

export async function callDesignStep(
  client: Client,
  step: DesignStep,
  version: number,
  created: Map<number, string>,
  index: number,
) {
  const operation = assistantOperationSchema.parse(structuredClone(step.operation))
  if (step.itemFromStep !== undefined) {
    const id = created.get(step.itemFromStep)
    if (!id || operation.tool !== 'configure_item_light' || step.itemFromStep >= index)
      throw new Error('Invalid new-item reference in design plan.')
    operation.args.itemId = id
  }
  const result = await callOperation(client, operation, version)
  if (operation.tool === 'place_floor_item') {
    const id = (result.structuredContent as { itemId?: string })?.itemId
    if (!id) throw new Error('Placement did not return its saved item identity.')
    created.set(index, id)
  }
}

export function assertDesignPreserved(
  before: SceneGraph,
  after: SceneGraph,
  request: DesignRequest,
  alternative: DesignAlternative,
) {
  const mutableItems = new Set(
    alternative.steps.flatMap(({ operation }) =>
      'itemId' in operation.args ? [operation.args.itemId] : [],
    ),
  )
  const protectedIds = new Set(request.protectedIds)
  const room = before.nodes[request.roomId as AnyNodeId]!
  const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
  for (const [id, original] of Object.entries(before.nodes)) {
    const current = after.nodes[id as AnyNodeId]
    if (!current) throw new Error(`Design unexpectedly removed ${id}.`)
    if (
      original.type === 'item' &&
      mutableItems.has(id) &&
      !protectedIds.has(id) &&
      original.metadata?.locked !== true &&
      original.metadata?.designLocked !== true
    ) {
      const { position: _p, rotation: _r, lighting: _l, ...rest } = original
      if (current.type !== 'item') throw new Error('Item type changed.')
      const { position: _np, rotation: _nr, lighting: _nl, ...next } = current
      if (!equal(rest, next)) throw new Error(`Design changed unrelated item properties: ${id}.`)
    } else if (id === request.roomId && original.type === 'zone' && current.type === 'zone') {
      const strip = (node: typeof original) => {
        const { wallMaterial: _w, floor, ...rest } = node
        const { finish: _f, ...floorRest } = floor ?? {}
        return { ...rest, floor: floorRest }
      }
      if (!equal(strip(original), strip(current)))
        throw new Error('Design changed room geometry or identity.')
    } else if (id === room.parentId && original.type === 'level' && current.type === 'level') {
      const { children, ...rest } = original
      const { children: nextChildren, ...next } = current
      if (
        !equal(rest, next) ||
        !equal(
          children,
          nextChildren.filter((child) => Boolean(before.nodes[child as AnyNodeId])),
        )
      )
        throw new Error('Design changed the level or existing hierarchy.')
    } else if (!equal(original, current))
      throw new Error(`Design changed a protected or unrelated node: ${id}.`)
  }
  const { nodes: _beforeNodes, ...beforeMeta } = before
  const { nodes: _afterNodes, ...afterMeta } = after
  if (!equal(beforeMeta, afterMeta)) throw new Error('Design changed unrelated scene metadata.')
}
