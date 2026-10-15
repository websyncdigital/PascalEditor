import type { SceneGraph } from '@pascal-app/core/clone-scene-graph'
import { type DesignRequest, designRequestSchema } from './design-contracts'

export function parseDesignRequest(
  prompt: string,
  graph: SceneGraph,
  selectedIds: string[],
): { request: DesignRequest } | { message: string } | null {
  const text = prompt.trim().toLowerCase()
  if (!/^(design|redesign|make|arrange|rearrange|generate|show me|use|keep)\b/.test(text))
    return null
  if (/\b(delete|demolish|resize|move walls|change walls)\b/.test(text))
    return {
      message: 'Room designs preserve structural geometry. Request structural edits separately.',
    }
  const nodes = Object.values(graph.nodes)
  let rooms = nodes.filter((node) => node.type === 'zone' && node.spaceRole === 'room')
  const named = rooms.filter(
    (room) =>
      text.includes(room.id.toLowerCase()) || (room.name && text.includes(room.name.toLowerCase())),
  )
  const selected = rooms.filter((room) => selectedIds.includes(room.id))
  if (named.length) rooms = named
  else if (selected.length) rooms = selected
  else if (rooms.length > 1) {
    const purpose = /bedroom/.test(text) ? /bedroom/i : /living/.test(text) ? /living/i : null
    if (purpose) rooms = rooms.filter((room) => purpose.test(room.name ?? ''))
  }
  if (rooms.length !== 1)
    return {
      message:
        'Select one room or include its exact room name or ID. A design changes only one room.',
    }
  const room = rooms[0]!
  const mode = /^(arrange|rearrange|generate|show me)/.test(text)
    ? 'rearrange'
    : /^use\b/.test(text)
      ? 'finishes'
      : 'design'
  const style = /scandinavian/.test(text)
    ? 'scandinavian'
    : /minimalist|minimalism/.test(text)
      ? 'modern-minimalist'
      : /contemporary/.test(text)
        ? 'contemporary'
        : null
  if (!style && mode === 'design' && !/^keep\b/.test(text))
    return {
      message:
        'Choose Scandinavian, Modern Minimalist, or Contemporary. Other styles are not mapped to the supported catalog yet.',
    }
  const purpose = /bedroom/.test(text)
    ? 'bedroom'
    : /living/.test(text)
      ? 'living'
      : /bedroom/i.test(room.name ?? '')
        ? 'bedroom'
        : /living/i.test(room.name ?? '')
          ? 'living'
          : null
  if (!purpose && mode !== 'finishes')
    return {
      message:
        'Tell me whether this room is a living room or bedroom. Other room purposes are not supported yet.',
    }
  const protectedIds: string[] = []
  const keep = text.match(/\bkeep (.+?)(?: and (?:redesign|rearrange)|[.;]|$)/)
  if (keep && !/^(?:the )?(?:walls|room)(?: unchanged)?$/.test(keep[1]!)) {
    for (const target of keep[1]!.split(/,| and /)) {
      const term = target
        .trim()
        .replace(/^(the |existing )+/, '')
        .replace(/ unchanged$/, '')
      const matches = nodes.filter(
        (node) =>
          node.type === 'item' &&
          ((term === 'selected' && selectedIds.includes(node.id)) ||
            node.id.toLowerCase() === term ||
            node.name?.toLowerCase() === term ||
            node.asset.id.toLowerCase() === term),
      )
      if (matches.length !== 1)
        return {
          message: `“Keep ${target.trim()}” needs one exact furniture ID or a uniquely named item.`,
        }
      protectedIds.push(matches[0]!.id)
    }
  }
  if (/\b(do not|don't) (move|change)|\block\b/.test(text) && !keep)
    return { message: 'Use “keep ITEM_ID” to identify furniture that must remain unchanged.' }
  const clearance = text.match(/clearance\s+([\d.]+)\s*m\b/)
  const result = designRequestSchema.safeParse({
    roomId: room.id,
    purpose: purpose ?? 'living',
    style: style ?? 'modern-minimalist',
    mode,
    alternatives: /\b(two|2)\b/.test(text) ? 2 : 3,
    protectedIds,
    itemClearance: clearance ? Number(clearance[1]) : /walking|circulation/.test(text) ? 0.8 : 0.6,
    requestedOak: /\boak\b/.test(text),
    preserveWalls: /without changing (?:the )?walls|keep (?:the )?walls/.test(text),
  })
  return result.success
    ? { request: result.data }
    : { message: 'Use a furniture clearance from 0.08 to 2 metres.' }
}
