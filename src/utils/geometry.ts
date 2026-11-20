import type { Annotation, Point } from '../types/annotations'

export function moveAnnotation(annotation: Annotation, dx: number, dy: number): Annotation {
  if (annotation.type === 'pen') {
    return { ...annotation, points: annotation.points.map(point => ({ x: point.x + dx, y: point.y + dy })) }
  }
  if (annotation.type === 'text') return { ...annotation, x: annotation.x + dx, y: annotation.y + dy }
  if (annotation.type === 'highlight') return { ...annotation, rects: annotation.rects.map(rect => ({ ...rect, x: rect.x + dx, y: rect.y + dy })) }
  if (annotation.type === 'underline') return { ...annotation, lines: annotation.lines.map(line => ({ start: { x: line.start.x + dx, y: line.start.y + dy }, end: { x: line.end.x + dx, y: line.end.y + dy } })) }
  return {
    ...annotation,
    start: { x: annotation.start.x + dx, y: annotation.start.y + dy },
    end: { x: annotation.end.x + dx, y: annotation.end.y + dy },
  }
}

export function arrowHead(start: Point, end: Point, width: number): [Point, Point] {
  const angle = Math.atan2(end.y - start.y, end.x - start.x)
  const length = Math.max(9, width * 5)
  const spread = Math.PI / 6
  return [
    { x: end.x - length * Math.cos(angle - spread), y: end.y - length * Math.sin(angle - spread) },
    { x: end.x - length * Math.cos(angle + spread), y: end.y - length * Math.sin(angle + spread) },
  ]
}

export function rectBounds(start: Point, end: Point) {
  return { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), width: Math.abs(end.x - start.x), height: Math.abs(end.y - start.y) }
}
