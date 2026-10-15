import type { AssistantPlanner, PlannerContext, PlannerOutput } from './contracts'

function choose(context: PlannerContext, type: string, target: string) {
  const query = target.trim().toLowerCase().replace(/^the /, '')
  const nodes = context.nodes.filter((node) => node.type === type)
  const found =
    query === 'selected'
      ? nodes.filter((node) => context.selectedIds.includes(node.id))
      : nodes.filter((node) => {
          const asset = node.asset as { id?: string } | undefined
          return (
            node.id === query ||
            String(node.name ?? '').toLowerCase() === query ||
            asset?.id === query ||
            (query === 'lamp' && String(asset?.id).includes('lamp'))
          )
        })
  if (found.length === 1) return found[0]!
  throw new Error(
    found.length
      ? `Choose one target by ID: ${found.map((n) => n.id).join(', ')}.`
      : `No matching ${type} was found. Select it and say “selected”, or use its exact name or ID.`,
  )
}

function roomFor(context: PlannerContext, item: PlannerContext['nodes'][number]) {
  const zones = context.nodes.filter(
    (node) => node.type === 'zone' && node.parentId === item.parentId,
  )
  if (zones.length !== 1)
    throw new Error(
      'There are multiple rooms on this level. Use the live planner with an explicit room ID, or test in a single-room scene.',
    )
  return zones[0]!
}

export const mockPlanner: AssistantPlanner = {
  mode: 'mock',
  async plan(prompt, context, signal): Promise<PlannerOutput> {
    signal.throwIfAborted()
    const text = prompt.trim().replace(/[.!]$/, '')
    try {
      let match = text.match(/^turn (.+) (on|off)$/i)
      if (match) {
        const node = choose(context, 'item', match[1]!)
        return {
          message: `Turn ${node.name ?? node.id} ${match[2]!.toLowerCase()}.`,
          operation: {
            tool: 'configure_item_light',
            args: {
              itemId: node.id,
              enabled: match[2]!.toLowerCase() === 'on',
              intensity: null,
              color: null,
            },
          },
        }
      }
      match = text.match(/^set (.+) (intensity|color) to (.+)$/i)
      if (match) {
        const node = choose(context, 'item', match[1]!)
        return {
          message: `Set ${node.name ?? node.id} ${match[2]} to ${match[3]}.`,
          operation: {
            tool: 'configure_item_light',
            args: {
              itemId: node.id,
              enabled: null,
              intensity: match[2]!.toLowerCase() === 'intensity' ? Number(match[3]) : null,
              color: match[2]!.toLowerCase() === 'color' ? match[3]! : null,
            },
          },
        }
      }
      match = text.match(/^move (.+) by (-?[\d.]+)\s*m(?:etres|eters)? on ([xz])$/i)
      if (match) {
        const node = choose(context, 'item', match[1]!)
        const position = [...(node.position as [number, number, number])] as [
          number,
          number,
          number,
        ]
        position[match[3]!.toLowerCase() === 'x' ? 0 : 2] += Number(match[2])
        return {
          message: `Move ${node.name ?? node.id} by ${match[2]} m along its level-local ${match[3]!.toUpperCase()} axis.`,
          operation: {
            tool: 'edit_floor_item',
            args: { itemId: node.id, zoneId: roomFor(context, node).id, position, rotationY: null },
          },
        }
      }
      match = text.match(/^rotate (.+) by (-?[\d.]+) degrees$/i)
      if (match) {
        const node = choose(context, 'item', match[1]!)
        return {
          message: `Rotate ${node.name ?? node.id} by ${match[2]} degrees around Y.`,
          operation: {
            tool: 'edit_floor_item',
            args: {
              itemId: node.id,
              zoneId: roomFor(context, node).id,
              position: null,
              rotationY: (node.rotation as number[])[1]! + (Number(match[2]) * Math.PI) / 180,
            },
          },
        }
      }
      match = text.match(/^delete (.+)$/i)
      if (match) {
        const node = choose(context, 'item', match[1]!)
        return {
          message: `Delete ${node.name ?? node.id}.`,
          operation: { tool: 'delete_floor_item', args: { itemId: node.id } },
        }
      }
      match = text.match(/^set (.+) (floor|wall) material to (\S+)$/i)
      if (match) {
        const room = choose(context, 'zone', match[1]!)
        return {
          message: `Change the room ${match[2]} finish to ${match[3]}.`,
          operation: {
            tool: 'set_room_finish',
            args: {
              zoneId: room.id,
              surface: match[2]!.toLowerCase() as 'floor' | 'wall',
              catalogMaterialId: match[3]!,
            },
          },
        }
      }
      match = text.match(/^add (\S+) to (.+) at (-?[\d.]+),\s*(-?[\d.]+),\s*(-?[\d.]+)$/i)
      if (match) {
        const room = choose(context, 'zone', match[2]!)
        return {
          message: `Place ${match[1]} at the specified level-local position.`,
          operation: {
            tool: 'place_floor_item',
            args: {
              catalogItemId: match[1]!,
              zoneId: room.id,
              position: [Number(match[3]), Number(match[4]), Number(match[5])],
              rotationY: 0,
            },
          },
        }
      }
      match = text.match(
        /^create room (.+) on (\S+) at (-?[\d.]+),\s*(-?[\d.]+) size ([\d.]+),\s*([\d.]+)$/i,
      )
      if (match) {
        const level = choose(context, 'level', match[2]!)
        const [x, z, w, d] = match.slice(3).map(Number) as [number, number, number, number]
        return {
          message: `Create room ${match[1]} with dimensions ${w} × ${d} m.`,
          operation: {
            tool: 'create_room',
            args: {
              levelId: level.id,
              name: match[1]!,
              polygon: [
                [x, z],
                [x + w, z],
                [x + w, z + d],
                [x, z + d],
              ],
            },
          },
        }
      }
      match = text.match(/^move room (.+) by (-?[\d.]+),\s*(-?[\d.]+)$/i)
      if (match) {
        const room = choose(context, 'zone', match[1]!)
        return {
          message: `Translate room ${room.name ?? room.id} by ${match[2]}, ${match[3]} m.`,
          operation: {
            tool: 'move_zone',
            args: { zoneId: room.id, translate: [Number(match[2]), Number(match[3])] },
          },
        }
      }
      return {
        message:
          'Mock mode handles one explicit change at a time. Try “move selected by 0.10 m on x”, “rotate selected by 15 degrees”, “turn lamp off”, or use a supported example below.',
        operation: null,
      }
    } catch (error) {
      return {
        message: error instanceof Error ? error.message : 'Please clarify the target.',
        operation: null,
      }
    }
  },
}
