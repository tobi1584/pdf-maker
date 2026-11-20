import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { Annotation } from '../types/annotations'
import { arrowHead, rectBounds } from '../utils/geometry'

function pdfColor(hex: string) {
  const value = hex.replace('#', '')
  return rgb(parseInt(value.slice(0, 2), 16) / 255, parseInt(value.slice(2, 4), 16) / 255, parseInt(value.slice(4, 6), 16) / 255)
}

export async function exportPdf(source: Uint8Array, annotations: Annotation[]): Promise<Uint8Array> {
  const document = await PDFDocument.load(source.slice())
  const font = await document.embedFont(StandardFonts.Helvetica)
  const pages = document.getPages()
  for (const annotation of annotations) {
    const page = pages[annotation.page - 1]
    if (!page) continue
    const color = pdfColor(annotation.color)
    const common = { color, thickness: annotation.width, opacity: annotation.opacity }
    if (annotation.type === 'pen') {
      for (let i = 1; i < annotation.points.length; i++) {
        page.drawLine({ start: annotation.points[i - 1], end: annotation.points[i], ...common })
      }
      if (annotation.points.length === 1) {
        const p = annotation.points[0]
        page.drawCircle({ x: p.x, y: p.y, size: annotation.width / 2, color, opacity: annotation.opacity })
      }
    } else if (annotation.type === 'highlight') {
      for (const rect of annotation.rects) page.drawRectangle({ ...rect, color, opacity: annotation.opacity })
    } else if (annotation.type === 'underline') {
      for (const line of annotation.lines) page.drawLine({ ...line, ...common })
    } else if (annotation.type === 'arrow') {
      page.drawLine({ start: annotation.start, end: annotation.end, ...common })
      const [a, b] = arrowHead(annotation.start, annotation.end, annotation.width)
      page.drawLine({ start: annotation.end, end: a, ...common })
      page.drawLine({ start: annotation.end, end: b, ...common })
    } else if (annotation.type === 'rect') {
      const bounds = rectBounds(annotation.start, annotation.end)
      page.drawRectangle({ ...bounds, borderColor: color, borderWidth: annotation.width, borderOpacity: annotation.opacity })
    } else {
      // Helvetica supports the Western European characters used in Spanish notes.
      const safeText = [...annotation.text].map(char => {
        try { font.encodeText(char); return char } catch { return '?' }
      }).join('')
      page.drawText(safeText, { x: annotation.x, y: annotation.y, size: annotation.fontSize, font, color, opacity: annotation.opacity, lineHeight: annotation.fontSize * 1.25, maxWidth: annotation.boxWidth })
    }
  }
  return document.save()
}
