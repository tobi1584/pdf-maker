import { useEffect, useRef, useState } from 'react'
import { TextLayer, type PDFDocumentProxy, type PDFPageProxy } from 'pdfjs-dist'
import type { Annotation, Settings, Tool } from '../../types/annotations'
import { AnnotationLayer } from '../annotations/AnnotationLayer'
import { useAnnotationStore } from '../../stores/annotationStore'
import { selectedTextRects } from './selectedTextRects'

type Props = { document: PDFDocumentProxy; number: number; zoom: number; rotation: number; defaultSize: { width: number; height: number }; tool: Tool; settings: Settings; editingId: string | null; onEdit: (id: string | null, before?: Annotation[]) => void; onError: (message: string) => void }

export function PdfPage({ document, number, zoom, rotation, defaultSize, tool, settings, editingId, onEdit, onError }: Props) {
  const wrapper = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const textLayer = useRef<HTMLDivElement>(null)
  const selectionStart = useRef<{ x: number; y: number; pointerId: number } | null>(null)
  const [visible, setVisible] = useState(false)
  const [page, setPage] = useState<PDFPageProxy | null>(null)
  useEffect(() => {
    const node = wrapper.current
    if (!node) return
    const observer = new IntersectionObserver(entries => setVisible(entries[0].isIntersecting), { rootMargin: '900px 0px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (!visible) { setPage(null); return }
    let cancelled = false
    document.getPage(number).then(result => { if (!cancelled) setPage(result) }).catch(() => onError(`No se pudo cargar la página ${number}.`))
    return () => { cancelled = true }
  }, [visible, document, number, onError])
  const viewport = page?.getViewport({ scale: 1, rotation: (page.rotate + rotation) % 360 })
  const width = (viewport?.width ?? (rotation % 180 ? defaultSize.height : defaultSize.width)) * zoom
  const height = (viewport?.height ?? (rotation % 180 ? defaultSize.width : defaultSize.height)) * zoom
  useEffect(() => {
    if (!page || !canvas.current || !viewport) return
    const element = canvas.current
    const ratio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(12_000_000 / (viewport.width * viewport.height * zoom * zoom)))
    const renderViewport = page.getViewport({ scale: zoom * ratio, rotation: (page.rotate + rotation) % 360 })
    element.width = Math.ceil(renderViewport.width)
    element.height = Math.ceil(renderViewport.height)
    element.style.width = `${viewport.width * zoom}px`
    element.style.height = `${viewport.height * zoom}px`
    const context = element.getContext('2d')
    if (!context) return
    const task = page.render({ canvasContext: context, canvas: element, viewport: renderViewport })
    task.promise.catch(error => { if (error?.name !== 'RenderingCancelledException') onError(`No se pudo dibujar la página ${number}.`) })
    return () => { task.cancel() }
  }, [page, zoom, rotation, viewport?.width, viewport?.height, number, onError])
  useEffect(() => {
    const container = textLayer.current
    if (!page || !container) return
    container.replaceChildren()
    const layer = new TextLayer({ textContentSource: page.streamTextContent(), container, viewport: page.getViewport({ scale: zoom, rotation: (page.rotate + rotation) % 360 }) })
    layer.render().catch(() => onError(`No se pudo seleccionar el texto de la página ${number}.`))
    return () => { layer.cancel(); container.replaceChildren() }
  }, [page, zoom, rotation, number, onError])

  const startSelection = (event: React.PointerEvent<HTMLDivElement>) => {
    selectionStart.current = null
    if (tool !== 'highlight' && tool !== 'underline') return
    window.getSelection()?.removeAllRanges()
    const target = event.target
    if (target instanceof Element && target.closest('.pdf-text-layer span')) {
      selectionStart.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId }
    }
  }

  const markSelection = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((tool !== 'highlight' && tool !== 'underline') || !viewport || !textLayer.current || !wrapper.current) return
    const start = selectionStart.current
    selectionStart.current = null
    if (!start || start.pointerId !== event.pointerId || Math.hypot(event.clientX - start.x, event.clientY - start.y) < 3) return
    const target = window.document.elementFromPoint(event.clientX, event.clientY)
    if (!(target instanceof Element) || !target.closest('.pdf-text-layer span')) return
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !selection.toString().trim() || !selection.rangeCount) return
    const range = selection.getRangeAt(0)
    if (!textLayer.current.contains(range.startContainer) || !textLayer.current.contains(range.endContainer)) return
    const bounds = wrapper.current.getBoundingClientRect()
    const rectangles = selectedTextRects(range, textLayer.current).filter(rect => rect.right > bounds.left && rect.left < bounds.right && rect.bottom > bounds.top && rect.top < bounds.bottom)
    if (!rectangles.length) return
    const toPdf = (x: number, y: number) => {
      const [pdfX, pdfY] = viewport.convertToPdfPoint((x - bounds.left) / zoom, (y - bounds.top) / zoom)
      return { x: pdfX, y: pdfY }
    }
    const base = { id: crypto.randomUUID(), page: number, color: settings.color, opacity: tool === 'highlight' ? 0.35 : settings.opacity, width: tool === 'underline' ? Math.max(1.5, settings.width / 2) : settings.width }
    const annotation: Annotation = tool === 'highlight'
      ? { ...base, type: 'highlight', rects: rectangles.map(rect => {
          const points = [toPdf(rect.left, rect.top), toPdf(rect.right, rect.top), toPdf(rect.right, rect.bottom), toPdf(rect.left, rect.bottom)]
          const xs = points.map(point => point.x), ys = points.map(point => point.y)
          return { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) }
        }) }
      : { ...base, type: 'underline', lines: rectangles.map(rect => ({ start: toPdf(rect.left, rect.bottom - 1), end: toPdf(rect.right, rect.bottom - 1) })) }
    const store = useAnnotationStore.getState()
    store.commit([...store.annotations, annotation])
    selection.removeAllRanges()
  }

  return <div id={`pdf-page-${number}`} ref={wrapper} className="page-shell" style={{ width, height }} aria-label={`Página ${number}`} onPointerDown={startSelection} onPointerUp={markSelection} onPointerCancel={() => { selectionStart.current = null }}>
    {page && viewport ? <><canvas ref={canvas} /><div ref={textLayer} className={`pdf-text-layer ${tool === 'highlight' || tool === 'underline' ? 'selectable' : ''}`} style={{ width, height, '--total-scale-factor': zoom } as React.CSSProperties} /><AnnotationLayer pageNumber={number} viewport={viewport} zoom={zoom} tool={tool} settings={settings} editingId={editingId} onEdit={onEdit} /></> : <div className="page-loading">Página {number}</div>}
  </div>
}
