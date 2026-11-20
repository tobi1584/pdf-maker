import { describe, expect, it } from 'vitest'
import { arrowHead, moveAnnotation, rectBounds } from './geometry'

describe('geometría de anotaciones', () => {
  it('mueve todos los puntos de un trazo sin depender del zoom', () => {
    const moved = moveAnnotation({ id: '1', page: 1, type: 'pen', points: [{ x: 10, y: 20 }, { x: 30, y: 40 }], color: '#000000', width: 2, opacity: 1 }, 5, -3)
    expect(moved.type === 'pen' && moved.points).toEqual([{ x: 15, y: 17 }, { x: 35, y: 37 }])
  })
  it('normaliza rectángulos dibujados en cualquier dirección', () => {
    expect(rectBounds({ x: 200, y: 300 }, { x: 50, y: 100 })).toEqual({ x: 50, y: 100, width: 150, height: 200 })
  })
  it('coloca la punta de flecha junto al extremo', () => {
    const [a, b] = arrowHead({ x: 0, y: 0 }, { x: 100, y: 0 }, 3)
    expect(a.x).toBeLessThan(100)
    expect(b.x).toBeLessThan(100)
    expect(a.y * b.y).toBeLessThan(0)
  })
})
