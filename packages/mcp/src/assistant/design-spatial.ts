import { polygonsIntersect, polygonsOverlap } from '@pascal-app/core'
import type { ZoneNode } from '@pascal-app/core/schema'
import { aabbsOverlap, type PlanAabb } from '../tools/door-clearance'
import { pointInPolygon, polygonBounds } from '../tools/geometry'

export function insideRoom(box: PlanAabb, room: ZoneNode): boolean {
  const ring: [number, number][] = [
    [box.minX, box.minZ],
    [box.maxX, box.minZ],
    [box.maxX, box.maxZ],
    [box.minX, box.maxZ],
  ]
  return (
    ring.every((point) => pointInPolygon(point, room.polygon)) &&
    !polygonsIntersect(ring, room.polygon) &&
    !room.holes.some((hole) => polygonsOverlap(ring, hole))
  )
}

export function checkCirculation(
  room: ZoneNode,
  obstacles: PlanAabb[],
  targets: PlanAabb[],
  doors: PlanAabb[],
  width: number,
): string | null {
  const b = polygonBounds(room.polygon)
  const step = Math.max(0.25, Math.max(b.width, b.depth) / 64)
  const radius = width / 2
  const cells = new Map<string, PlanAabb>()
  for (let ix = 0; ix * step < b.width; ix++) {
    for (let iz = 0; iz * step < b.depth; iz++) {
      const x = b.minX + (ix + 0.5) * step
      const z = b.minZ + (iz + 0.5) * step
      const box = { minX: x - radius, maxX: x + radius, minZ: z - radius, maxZ: z + radius }
      if (insideRoom(box, room) && !obstacles.some((other) => aabbsOverlap(box, other)))
        cells.set(`${ix},${iz}`, box)
    }
  }
  if (!cells.size) return `No ${width} m circulation space was found on the sampling grid.`
  const remaining = new Set(cells.keys())
  const components: PlanAabb[][] = []
  while (remaining.size) {
    const queue = [remaining.values().next().value!]
    remaining.delete(queue[0]!)
    const component: PlanAabb[] = []
    for (let index = 0; index < queue.length; index++) {
      const key = queue[index]!
      const box = cells.get(key)!
      component.push(box)
      const [ix, iz] = key.split(',').map(Number) as [number, number]
      for (const next of [
        `${ix + 1},${iz}`,
        `${ix - 1},${iz}`,
        `${ix},${iz + 1}`,
        `${ix},${iz - 1}`,
      ]) {
        if (!remaining.has(next)) continue
        const neighbor = cells.get(next)!
        const swept = {
          minX: Math.min(box.minX, neighbor.minX),
          maxX: Math.max(box.maxX, neighbor.maxX),
          minZ: Math.min(box.minZ, neighbor.minZ),
          maxZ: Math.max(box.maxZ, neighbor.maxZ),
        }
        if (!insideRoom(swept, room) || obstacles.some((other) => aabbsOverlap(swept, other)))
          continue
        remaining.delete(next)
        queue.push(next)
      }
    }
    components.push(component)
  }
  const nearby = (box: PlanAabb, target: PlanAabb) => aabbsOverlap(box, target, step + 0.05)
  const relevantDoors = doors.filter(
    (door) => door.minX < b.maxX && door.maxX > b.minX && door.minZ < b.maxZ && door.maxZ > b.minZ,
  )
  const connected = components.some(
    (component) =>
      targets.every((target) => component.some((box) => nearby(box, target))) &&
      relevantDoors.every((door) => component.some((box) => aabbsOverlap(box, door))),
  )
  return connected
    ? null
    : `No connected ${width} m sampled route reaches every furniture footprint and represented room doorway. Try fewer objects or a different clearance.`
}
