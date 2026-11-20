import { describe, expect, it } from 'vitest'
import { addCustomColor } from './customColors'

describe('colores personalizados', () => {
  it('conserva cinco colores en orden de entrada y descarta el más antiguo al añadir otro', () => {
    const colors = ['#111111', '#222222', '#333333', '#444444', '#555555']
    expect(addCustomColor(colors, '#666666')).toEqual(['#222222', '#333333', '#444444', '#555555', '#666666'])
    expect(addCustomColor(colors, '#333333')).toEqual(colors)
  })
})
