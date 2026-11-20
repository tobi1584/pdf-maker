import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import { exportPdf } from './exportPdf'
import type { Annotation } from '../types/annotations'

describe('exportPdf', () => {
  it('conserva las páginas y escribe texto y figuras en las coordenadas del PDF', async () => {
    const original = await PDFDocument.create()
    original.addPage([400, 600])
    original.addPage([400, 600])
    const source = await original.save()
    const annotations: Annotation[] = [
      { id: 'text', page: 1, type: 'text', x: 72, y: 500, text: 'Oposición', fontSize: 18, color: '#1f2937', width: 2, opacity: 1 },
      { id: 'pen', page: 1, type: 'pen', points: [{ x: 50, y: 450 }, { x: 120, y: 445 }], color: '#e43f50', width: 4, opacity: 0.6 },
      { id: 'arrow', page: 2, type: 'arrow', start: { x: 40, y: 100 }, end: { x: 180, y: 160 }, color: '#2685d8', width: 3, opacity: 1 },
      { id: 'rect', page: 2, type: 'rect', start: { x: 220, y: 100 }, end: { x: 320, y: 180 }, color: '#25a86a', width: 2, opacity: 1 },
      { id: 'highlight', page: 1, type: 'highlight', rects: [{ x: 70, y: 490, width: 100, height: 20 }], color: '#facc15', width: 2, opacity: 0.35 },
      { id: 'underline', page: 1, type: 'underline', lines: [{ start: { x: 70, y: 480 }, end: { x: 170, y: 480 } }], color: '#2685d8', width: 2, opacity: 1 },
    ]
    const result = await exportPdf(source, annotations)
    const loaded = await PDFDocument.load(result)
    expect(loaded.getPageCount()).toBe(2)
    expect(loaded.getPage(0).getWidth()).toBe(400)
    const viewed = await pdfjs.getDocument({ data: result.slice() }).promise
    const firstPage = await viewed.getPage(1)
    const text = await firstPage.getTextContent()
    expect(text.items.some(item => 'str' in item && item.str.includes('Oposición'))).toBe(true)
    const inserted = text.items.find(item => 'str' in item && item.str.includes('Oposición'))
    if (!inserted || !('transform' in inserted)) throw new Error('No se encontró el texto exportado')
    expect(inserted.transform[4]).toBeCloseTo(72, 1)
    expect(inserted.transform[5]).toBeCloseTo(500, 1)
    const fixedPoint = { x: 180, y: 160 }
    for (const rotation of [0, 90, 180, 270]) {
      for (const scale of [0.5, 1, 2]) {
        const viewport = firstPage.getViewport({ scale, rotation })
        const screen = viewport.convertToViewportPoint(fixedPoint.x, fixedPoint.y)
        const restored = viewport.convertToPdfPoint(screen[0], screen[1])
        expect(restored[0]).toBeCloseTo(fixedPoint.x, 5)
        expect(restored[1]).toBeCloseTo(fixedPoint.y, 5)
      }
    }
    const firstOps = await firstPage.getOperatorList()
    const secondOps = await (await viewed.getPage(2)).getOperatorList()
    expect(firstOps.fnArray.length).toBeGreaterThan(5)
    expect(secondOps.fnArray.length).toBeGreaterThan(5)
    await viewed.destroy()
  })

  it('incorpora el resaltado y el subrayado al PDF descargado', async () => {
    const original = await PDFDocument.create()
    original.addPage([300, 400])
    const source = await original.save()
    const marks: Annotation[] = [
      { id: 'h', page: 1, type: 'highlight', rects: [{ x: 40, y: 300, width: 100, height: 18 }], color: '#facc15', opacity: 0.35, width: 2 },
      { id: 'u', page: 1, type: 'underline', lines: [{ start: { x: 40, y: 290 }, end: { x: 140, y: 290 } }], color: '#2685d8', opacity: 1, width: 2 },
    ]
    const output = await exportPdf(source, marks)
    const viewed = await pdfjs.getDocument({ data: output.slice() }).promise
    const operations = await (await viewed.getPage(1)).getOperatorList()
    expect(operations.fnArray).toContain(pdfjs.OPS.setFillRGBColor)
    expect(operations.fnArray).toContain(pdfjs.OPS.setStrokeRGBColor)
    expect(operations.fnArray.filter(value => value === pdfjs.OPS.constructPath)).toHaveLength(2)
    await viewed.destroy()
  })
})
