import { useRef, useState } from 'react'
import type { PDFPageProxy } from 'pdfjs-dist'
import type { Annotation, InkAnnotation, Point, Settings, ShapeAnnotation, TextAnnotation, Tool } from '../../types/annotations'
import { useAnnotationStore } from '../../stores/annotationStore'
import { arrowHead, moveAnnotation, rectBounds } from '../../utils/geometry'

type Viewport = ReturnType<PDFPageProxy['getViewport']>
type Props = { pageNumber: number; viewport: Viewport; zoom: number; tool: Tool; settings: Settings; editingId: string | null; onEdit: (id: string | null, before?: Annotation[]) => void }
type Gesture = { kind: 'draw'; annotation: InkAnnotation | ShapeAnnotation } | { kind: 'move'; id: string; origin: Point; before: Annotation[] } | { kind: 'text'; origin: Point; current: Point }

export function AnnotationLayer({ pageNumber, viewport, zoom, tool, settings, editingId, onEdit }: Props) {
  const { annotations, selectedId, select, commit, preview, finishPreview } = useAnnotationStore()
  const [draft, setDraft] = useState<Annotation | null>(null)
  const gesture = useRef<Gesture | null>(null)
  const svg = useRef<SVGSVGElement>(null)
  const textEditor = useRef<HTMLTextAreaElement>(null)
  const pageAnnotations = annotations.filter(a => a.page === pageNumber)
  const matrix = `matrix(${viewport.transform.join(' ')})`
  const pointFromEvent = (event: { clientX: number; clientY: number }): Point => {
    const bounds = svg.current!.getBoundingClientRect()
    const [x, y] = viewport.convertToPdfPoint((event.clientX - bounds.left) / zoom, (event.clientY - bounds.top) / zoom)
    return { x, y }
  }

  const start = (event: React.PointerEvent<SVGSVGElement>) => {
    if (tool === 'hand') return
    if (tool === 'select' || tool === 'eraser') { select(null); return }
    const point = pointFromEvent(event)
    if (tool === 'text') {
      if (event.button !== 0) return
      gesture.current = { kind: 'text', origin: point, current: point }
      event.currentTarget.setPointerCapture(event.pointerId)
      return
    }
    const base = { id: crypto.randomUUID(), page: pageNumber, color: settings.color, opacity: settings.opacity, width: settings.width }
    if (tool !== 'pen' && tool !== 'arrow' && tool !== 'rect') return
    const annotation: InkAnnotation | ShapeAnnotation = tool === 'pen' ? { ...base, type: 'pen', points: [point] } : { ...base, type: tool, start: point, end: point }
    gesture.current = { kind: 'draw', annotation }
    setDraft(annotation)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const move = (event: React.PointerEvent<SVGSVGElement>) => {
    const current = gesture.current
    if (!current) return
    const point = pointFromEvent(event)
    if (current.kind === 'text') {
      gesture.current = { ...current, current: point }
      setDraft({ id: 'text-draft', page: pageNumber, type: 'rect', start: current.origin, end: point, color: settings.color, opacity: 1, width: 1 })
    } else if (current.kind === 'draw') {
      if (current.annotation.type === 'pen') {
        const last = current.annotation.points[current.annotation.points.length - 1]
        if (Math.hypot(point.x - last.x, point.y - last.y) * zoom < 1.5) return
      }
      const next: InkAnnotation | ShapeAnnotation = current.annotation.type === 'pen'
        ? { ...current.annotation, points: [...current.annotation.points, point] }
        : { ...current.annotation, end: point }
      gesture.current = { kind: 'draw', annotation: next }
      setDraft(next)
    } else {
      const dx = point.x - current.origin.x
      const dy = point.y - current.origin.y
      preview(current.before.map(a => a.id === current.id ? moveAnnotation(a, dx, dy) : a))
    }
  }

  const end = () => {
    const current = gesture.current
    gesture.current = null
    setDraft(null)
    if (!current) return
    if (current.kind === 'move') finishPreview(current.before)
    else if (current.kind === 'text') {
      const bounds = rectBounds(current.origin, current.current)
      if (bounds.width < 12 / zoom || bounds.height < 12 / zoom) return
      const before = useAnnotationStore.getState().annotations
      const annotation: TextAnnotation = { id: crypto.randomUUID(), page: pageNumber, type: 'text', x: bounds.x, y: bounds.y + bounds.height - settings.fontSize, text: '', fontSize: settings.fontSize, boxWidth: bounds.width, boxHeight: bounds.height, color: settings.color, opacity: settings.opacity, width: settings.width }
      preview([...before, annotation])
      select(annotation.id)
      onEdit(annotation.id, before)
    }
    else {
      const a = current.annotation
      if (a.type === 'pen' || Math.hypot(a.end.x - a.start.x, a.end.y - a.start.y) > 2) commit([...useAnnotationStore.getState().annotations, a])
    }
  }
  const cancel = () => { gesture.current = null; setDraft(null) }

  const onAnnotationDown = (event: React.PointerEvent, annotation: Annotation) => {
    if (tool !== 'select' && tool !== 'eraser' && !(tool === 'text' && annotation.type === 'text')) return
    event.stopPropagation()
    if (tool === 'eraser') {
      commit(useAnnotationStore.getState().annotations.filter(a => a.id !== annotation.id))
      select(null)
      return
    }
    if (tool === 'text') {
      event.preventDefault()
      onEdit(annotation.id, useAnnotationStore.getState().annotations)
      return
    }
    select(annotation.id)
    gesture.current = { kind: 'move', id: annotation.id, origin: pointFromEvent(event), before: useAnnotationStore.getState().annotations }
    svg.current?.setPointerCapture(event.pointerId)
  }

  const renderAnnotation = (annotation: Annotation) => {
    const active = annotation.id === selectedId && tool === 'select'
    const interact = tool === 'select' || tool === 'eraser'
    const stroke = annotation.color
    const props = { stroke, strokeWidth: annotation.width, opacity: annotation.opacity, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
    let shape: React.ReactNode
    let hit: React.ReactNode
    if (annotation.type === 'pen') {
      const points = annotation.points.map(p => `${p.x},${p.y}`).join(' ')
      shape = annotation.points.length === 1 ? <circle cx={annotation.points[0].x} cy={annotation.points[0].y} r={annotation.width / 2} fill={stroke} /> : <polyline points={points} {...props} />
      hit = <polyline points={points} stroke="transparent" strokeWidth={Math.max(14, annotation.width + 8)} fill="none" />
    } else if (annotation.type === 'text') {
      const lines = annotation.text.split('\n')
      const maxLength = Math.max(1, ...lines.map(line => line.length))
      shape = annotation.boxWidth && annotation.boxHeight
        ? <foreignObject transform={`translate(${annotation.x} ${annotation.y + annotation.fontSize}) scale(1 -1)`} width={annotation.boxWidth} height={annotation.boxHeight} opacity={annotation.opacity}><div style={{ width: '100%', height: '100%', overflow: 'hidden', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: stroke, font: `${annotation.fontSize}px Arial, sans-serif`, lineHeight: 1.25 }}>{annotation.text}</div></foreignObject>
        : <text transform={`translate(${annotation.x} ${annotation.y}) scale(1 -1)`} fill={stroke} opacity={annotation.opacity} fontSize={annotation.fontSize} fontFamily="Arial, sans-serif">{lines.map((line, i) => <tspan key={i} x="0" dy={i === 0 ? 0 : annotation.fontSize * 1.25}>{line || '\u00a0'}</tspan>)}</text>
      hit = <rect x={annotation.x} y={annotation.boxHeight ? annotation.y + annotation.fontSize - annotation.boxHeight : annotation.y - (lines.length - 1) * annotation.fontSize * 1.25} width={annotation.boxWidth ?? maxLength * annotation.fontSize * 0.65 + 8} height={annotation.boxHeight ?? lines.length * annotation.fontSize * 1.25} fill="transparent" />
    } else if (annotation.type === 'arrow') {
      const [a, b] = arrowHead(annotation.start, annotation.end, annotation.width)
      shape = <g {...props}><line x1={annotation.start.x} y1={annotation.start.y} x2={annotation.end.x} y2={annotation.end.y} /><line x1={annotation.end.x} y1={annotation.end.y} x2={a.x} y2={a.y} /><line x1={annotation.end.x} y1={annotation.end.y} x2={b.x} y2={b.y} /></g>
      hit = <line x1={annotation.start.x} y1={annotation.start.y} x2={annotation.end.x} y2={annotation.end.y} stroke="transparent" strokeWidth="16" />
    } else if (annotation.type === 'highlight') {
      shape = <g fill={stroke} opacity={annotation.opacity}>{annotation.rects.map((rect, i) => <rect key={i} {...rect} />)}</g>
      hit = <g>{annotation.rects.map((rect, i) => <rect key={i} {...rect} fill="transparent" />)}</g>
    } else if (annotation.type === 'underline') {
      shape = <g {...props}>{annotation.lines.map((line, i) => <line key={i} x1={line.start.x} y1={line.start.y} x2={line.end.x} y2={line.end.y} />)}</g>
      hit = <g>{annotation.lines.map((line, i) => <line key={i} x1={line.start.x} y1={line.start.y} x2={line.end.x} y2={line.end.y} stroke="transparent" strokeWidth="14" />)}</g>
    } else {
      const bounds = rectBounds(annotation.start, annotation.end)
      shape = <rect {...bounds} {...props} />
      hit = <rect {...bounds} fill="transparent" stroke="transparent" strokeWidth="12" />
    }
    return <g key={annotation.id} onPointerDown={event => onAnnotationDown(event, annotation)} onDoubleClick={event => { if (tool === 'select' && annotation.type === 'text') { event.stopPropagation(); onEdit(annotation.id, useAnnotationStore.getState().annotations) } }} style={{ pointerEvents: interact || (tool === 'text' && annotation.type === 'text') ? 'auto' : 'none', cursor: tool === 'text' ? 'text' : tool === 'eraser' ? 'crosshair' : 'move' }}>
      {annotation.id !== editingId && shape}{(interact || (tool === 'text' && annotation.type === 'text')) && hit}{active && annotation.type === 'text' && <circle cx={annotation.x} cy={annotation.y} r="5" fill="#2563eb" />}
    </g>
  }

  const editor = pageAnnotations.find(a => a.id === editingId && a.type === 'text')
  const editorPoint = editor?.type === 'text' ? viewport.convertToViewportPoint(editor.x, editor.y) : null
  const editorBox = editor?.type === 'text' && editor.boxWidth && editor.boxHeight ? (() => {
    const corners = [[editor.x, editor.y + editor.fontSize], [editor.x + editor.boxWidth, editor.y + editor.fontSize], [editor.x, editor.y + editor.fontSize - editor.boxHeight], [editor.x + editor.boxWidth, editor.y + editor.fontSize - editor.boxHeight]].map(([x, y]) => viewport.convertToViewportPoint(x, y))
    const xs = corners.map(point => point[0]), ys = corners.map(point => point[1])
    return { left: Math.min(...xs) * zoom, top: Math.min(...ys) * zoom, width: (Math.max(...xs) - Math.min(...xs)) * zoom, height: (Math.max(...ys) - Math.min(...ys)) * zoom }
  })() : null
  const saveEditorSize = () => {
    if (editor?.type !== 'text' || !editorBox || !textEditor.current) return
    const width = textEditor.current.offsetWidth / zoom
    const height = textEditor.current.offsetHeight / zoom
    if (Math.abs(width - editorBox.width / zoom) < 1 && Math.abs(height - editorBox.height / zoom) < 1) return
    const rotated = viewport.rotation % 180 !== 0
    preview(useAnnotationStore.getState().annotations.map(a => a.id === editor.id ? { ...a, boxWidth: rotated ? height : width, boxHeight: rotated ? width : height } : a))
  }
  return <>
    <svg ref={svg} className={`annotation-layer tool-${tool}`} style={{ width: viewport.width * zoom, height: viewport.height * zoom }} viewBox={`0 0 ${viewport.width} ${viewport.height}`} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={cancel}>
      <rect x="0" y="0" width={viewport.width} height={viewport.height} fill="transparent" pointerEvents={tool === 'highlight' || tool === 'underline' ? 'none' : 'all'} />
      <g transform={matrix}>{pageAnnotations.map(renderAnnotation)}{draft && renderAnnotation(draft)}</g>
    </svg>
    {editor?.type === 'text' && editorPoint && <textarea ref={textEditor} autoFocus className="inline-editor" aria-label="Editar texto" style={{ left: editorBox?.left ?? editorPoint[0] * zoom, top: editorBox?.top ?? editorPoint[1] * zoom - editor.fontSize * zoom, width: editorBox?.width, height: editorBox?.height, fontSize: editor.fontSize * zoom, color: editor.color }} value={editor.text} onPointerDown={event => event.stopPropagation()} onPointerUp={saveEditorSize} onChange={event => preview(useAnnotationStore.getState().annotations.map(a => a.id === editor.id ? { ...a, text: event.target.value } : a))} onBlur={() => { saveEditorSize(); onEdit(null) }} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); onEdit(null) } }} />}
  </>
}
