export type Tool = 'select' | 'hand' | 'highlight' | 'underline' | 'pen' | 'text' | 'arrow' | 'rect' | 'eraser'
export type Point = { x: number; y: number }
export type PdfRect = { x: number; y: number; width: number; height: number }
export type BaseAnnotation = {
  id: string
  page: number
  color: string
  opacity: number
  width: number
}
export type InkAnnotation = BaseAnnotation & { type: 'pen'; points: Point[] }
export type TextAnnotation = BaseAnnotation & { type: 'text'; x: number; y: number; text: string; fontSize: number; boxWidth?: number; boxHeight?: number }
export type ShapeAnnotation = BaseAnnotation & ({ type: 'arrow'; start: Point; end: Point } | { type: 'rect'; start: Point; end: Point })
export type HighlightAnnotation = BaseAnnotation & { type: 'highlight'; rects: PdfRect[] }
export type UnderlineAnnotation = BaseAnnotation & { type: 'underline'; lines: { start: Point; end: Point }[] }
export type Annotation = InkAnnotation | TextAnnotation | ShapeAnnotation | HighlightAnnotation | UnderlineAnnotation

export type Settings = { color: string; opacity: number; width: number; fontSize: number }
