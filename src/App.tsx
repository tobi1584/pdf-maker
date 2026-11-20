import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { exportPdf } from './services/exportPdf'
import { PdfPage } from './features/pdf/PdfPage'
import { ActionIcon, ToolIcon } from './components/ToolIcon'
import { addCustomColor, MAX_CUSTOM_COLORS, readCustomColors } from './utils/customColors'
import { useAnnotationStore } from './stores/annotationStore'
import type { Annotation, Settings, Tool } from './types/annotations'

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

const TOOLS: { id: Tool; label: string; key: string }[] = [
  { id: 'select', label: 'Seleccionar', key: 'V' },
  { id: 'hand', label: 'Mano', key: 'H' },
  { id: 'highlight', label: 'Resaltar texto', key: 'S' },
  { id: 'underline', label: 'Subrayar texto', key: 'U' },
  { id: 'pen', label: 'Rotulador', key: 'P' },
  { id: 'text', label: 'Texto', key: 'T' },
  { id: 'arrow', label: 'Flecha', key: 'A' },
  { id: 'rect', label: 'Rectángulo', key: 'R' },
  { id: 'eraser', label: 'Borrador', key: 'E' },
]
const COLORS = [
  { name: 'Rojo', value: '#e43f50' }, { name: 'Naranja', value: '#f59e0b' },
  { name: 'Amarillo', value: '#facc15' }, { name: 'Verde', value: '#25a86a' },
  { name: 'Azul', value: '#2685d8' }, { name: 'Violeta', value: '#6c56c9' },
  { name: 'Negro', value: '#1f2937' },
]

export default function App() {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null)
  const [source, setSource] = useState<Uint8Array | null>(null)
  const [filename, setFilename] = useState('')
  const [pageCount, setPageCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState('1')
  const [defaultSize, setDefaultSize] = useState({ width: 612, height: 792 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [tool, setTool] = useState<Tool>('select')
  const [settings, setSettings] = useState<Settings>({ color: COLORS[0].value, opacity: 1, width: 3, fontSize: 16 })
  const [customColors, setCustomColors] = useState(readCustomColors)
  const [editingId, setEditingId] = useState<string | null>(null)
  const editBefore = useRef<Annotation[] | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [dark, setDark] = useState(() => window.localStorage.getItem('apuntespdf-theme') === 'dark')
  const [panning, setPanning] = useState(false)
  const viewer = useRef<HTMLDivElement>(null)
  const panPoint = useRef<{ pointerId: number; x: number; y: number } | null>(null)
  const zoomAnchor = useRef<{ id: string; x: number; y: number; clientX: number; clientY: number } | null>(null)
  const scrollFrame = useRef<number | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const { annotations, past, future, selectedId, reset, select, commit, preview, finishPreview, undo, redo } = useAnnotationStore()
  const selected = annotations.find(a => a.id === selectedId)

  const openFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') { setError('Selecciona un archivo PDF.'); return }
    if (document && past.length && !window.confirm('Se perderán los cambios del documento actual. ¿Abrir otro PDF?')) return
    setBusy(true); setError('')
    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      const loaded = await pdfjs.getDocument({ data: bytes.slice() }).promise
      const first = await loaded.getPage(1)
      const viewport = first.getViewport({ scale: 1 })
      await document?.destroy()
      setSource(bytes); setDocument(loaded); setFilename(file.name); setPageCount(loaded.numPages)
      setDefaultSize({ width: viewport.width, height: viewport.height }); setCurrentPage(1); setPageInput('1'); setZoom(1); setRotation(0); reset(); setTool('select'); setEditingId(null); editBefore.current = null
      if (viewer.current) viewer.current.scrollTop = 0
    } catch { setError('No se pudo abrir el PDF. Comprueba que el archivo no esté dañado o protegido con contraseña.') }
    finally { setBusy(false); if (fileInput.current) fileInput.current.value = '' }
  }

  const onEdit = (id: string | null, before?: Annotation[]) => {
    if (id) { editBefore.current = before ?? useAnnotationStore.getState().annotations; setEditingId(id); return }
    if (editBefore.current) {
      const current = useAnnotationStore.getState().annotations
      const cleaned = current.filter(a => a.type !== 'text' || a.text.trim())
      preview(cleaned)
      finishPreview(editBefore.current)
    }
    editBefore.current = null
    setEditingId(null)
  }

  const goToPage = (target: number) => {
    const page = Math.max(1, Math.min(pageCount, Math.floor(target)))
    if (!Number.isFinite(page)) return
    window.document.getElementById(`pdf-page-${page}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    setCurrentPage(page); setPageInput(String(page))
  }
  const updateCurrentPage = useCallback(() => {
    if (scrollFrame.current !== null) return
    scrollFrame.current = requestAnimationFrame(() => {
      scrollFrame.current = null
    const node = viewer.current
    if (!node || !pageCount) return
    const top = node.getBoundingClientRect().top + 110
    let closest = 1, distance = Infinity
    for (const child of node.querySelectorAll<HTMLElement>('.page-shell')) {
      const difference = Math.abs(child.getBoundingClientRect().top - top)
      if (difference < distance) { distance = difference; closest = Number(child.id.replace('pdf-page-', '')) }
    }
    setCurrentPage(closest); setPageInput(String(closest))
    })
  }, [pageCount])
  useEffect(() => () => { if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current) }, [])
  useEffect(() => { window.localStorage.setItem('apuntespdf-theme', dark ? 'dark' : 'light') }, [dark])
  useEffect(() => { window.localStorage.setItem('apuntespdf-custom-colors', JSON.stringify(customColors)) }, [customColors])

  useEffect(() => {
    const node = viewer.current
    if (!node) return
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return
      event.preventDefault()
      const target = event.target as Element
      const page = target.closest<HTMLElement>('.page-shell') ?? node.querySelector<HTMLElement>(`#pdf-page-${currentPage}`)
      if (page) {
        const bounds = page.getBoundingClientRect()
        zoomAnchor.current = { id: page.id, x: (event.clientX - bounds.left) / bounds.width, y: (event.clientY - bounds.top) / bounds.height, clientX: event.clientX, clientY: event.clientY }
      }
      setZoom(value => Math.max(0.25, Math.min(3, +(value * Math.exp(-event.deltaY * 0.002)).toFixed(3))))
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [document, currentPage])
  useLayoutEffect(() => {
    const anchor = zoomAnchor.current
    const node = viewer.current
    if (!anchor || !node) return
    const page = window.document.getElementById(anchor.id)
    if (!page) return
    const bounds = page.getBoundingClientRect()
    node.scrollLeft += bounds.left + bounds.width * anchor.x - anchor.clientX
    node.scrollTop += bounds.top + bounds.height * anchor.y - anchor.clientY
    zoomAnchor.current = null
  }, [zoom])

  const startPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (tool !== 'hand' || event.button !== 0) return
    event.preventDefault()
    panPoint.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
    setPanning(true)
  }
  const movePan = (event: React.PointerEvent<HTMLDivElement>) => {
    const point = panPoint.current
    if (!point || point.pointerId !== event.pointerId) return
    event.currentTarget.scrollLeft -= event.clientX - point.x
    event.currentTarget.scrollTop -= event.clientY - point.y
    panPoint.current = { ...point, x: event.clientX, y: event.clientY }
  }
  const stopPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (panPoint.current?.pointerId !== event.pointerId) return
    panPoint.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    setPanning(false)
  }

  const fitWidth = () => { if (viewer.current) setZoom(Math.max(0.25, Math.min(3, (viewer.current.clientWidth - 64) / (rotation % 180 ? defaultSize.height : defaultSize.width)))) }
  const download = async () => {
    if (!source) return
    setBusy(true); setError('')
    try {
      const bytes = await exportPdf(source, annotations)
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url; link.download = filename.replace(/\.pdf$/i, '') + '-anotado.pdf'; link.click()
      setTimeout(() => URL.revokeObjectURL(url), 30000)
    } catch { setError('No se pudo exportar el PDF. Intenta abrir el documento de nuevo.') }
    finally { setBusy(false) }
  }

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('input, textarea, [contenteditable]')) return
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); if (event.shiftKey) redo(); else undo(); return }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); return }
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) { commit(useAnnotationStore.getState().annotations.filter(a => a.id !== selectedId)); select(null); return }
      const found = TOOLS.find(item => item.key.toLowerCase() === event.key.toLowerCase())
      if (found && !event.ctrlKey && !event.metaKey && document) setTool(found.id)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [document, selectedId, commit, redo, undo, select])
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => { if (past.length) event.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [past.length])

  const updateSelected = (changes: Partial<Annotation>) => {
    if (!selected) return
    commit(annotations.map(a => a.id === selected.id ? { ...a, ...changes } as Annotation : a))
  }
  return <div className={`app ${dark ? 'dark' : ''}`}>
    <header className="topbar">
      <div className="brand"><span className="brand-mark">A</span><span>Apuntes<span className="brand-accent">PDF</span></span></div>
      <div className="file-actions"><button className="button button-primary" onClick={() => fileInput.current?.click()} disabled={busy}>Abrir PDF</button><input ref={fileInput} type="file" accept="application/pdf,.pdf" hidden onChange={event => { const file = event.target.files?.[0]; if (file) void openFile(file) }} /><span className="filename" title={filename}>{filename || 'Ningún documento abierto'}</span></div>
      <div className="quick-actions" role="group" aria-label="Deshacer y rehacer">
        <button className="quick-action" disabled={!past.length} onClick={undo} aria-label="Deshacer" title="Deshacer (Ctrl+Z)"><ActionIcon action="undo" /></button>
        <button className="quick-action" disabled={!future.length} onClick={redo} aria-label="Rehacer" title="Rehacer (Ctrl+Y)"><ActionIcon action="redo" /></button>
      </div>
      <button className="button theme-toggle" onClick={() => setDark(value => !value)} aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'} title={dark ? 'Modo claro' : 'Modo oscuro'}>{dark ? '☀' : '☾'}<span>{dark ? 'Claro' : 'Oscuro'}</span></button>
      <button className="button button-export" disabled={!document || busy} onClick={() => void download()}>{busy ? 'Procesando…' : 'Descargar PDF'}</button>
    </header>
    <div className="workspace">
      <aside className="sidebar">
        <div className="section-label">HERRAMIENTAS</div>
        <div className="tool-list">{TOOLS.map(item => <button key={item.id} title={`${item.label} (${item.key})`} aria-label={item.label} aria-pressed={tool === item.id} className={`tool-button ${tool === item.id ? 'active' : ''}`} onClick={() => setTool(item.id)} disabled={!document}><span className="tool-icon"><ToolIcon tool={item.id} /></span><span className="tool-label">{item.label}</span><kbd>{item.key}</kbd></button>)}</div>
        <div className="divider" />
        <div className="section-label">OPCIONES</div>
        <div className="color-heading"><span className="control-label">Color</span><span className="color-value">{COLORS.find(color => color.value === settings.color)?.name ?? 'Personalizado'}</span></div>
        <div className="color-palettes">
          <div className="colors" role="group" aria-label="Colores habituales">{COLORS.map(color => <button key={color.value} title={color.name} aria-label={color.name} aria-pressed={settings.color === color.value} className={`color-button ${settings.color === color.value ? 'chosen' : ''}`} style={{ backgroundColor: color.value }} onClick={() => { setSettings({ ...settings, color: color.value }); updateSelected({ color: color.value }) }} />)}</div>
          <div className="colors custom-colors" role="group" aria-label="Colores personalizados">{Array.from({ length: MAX_CUSTOM_COLORS }, (_, index) => customColors[index] ? <button key={index} title={`Color personalizado ${index + 1}`} aria-label={`Color personalizado ${index + 1}: ${customColors[index]}`} aria-pressed={settings.color === customColors[index]} className={`color-button ${settings.color === customColors[index] ? 'chosen' : ''}`} style={{ backgroundColor: customColors[index] }} onClick={() => { const color = customColors[index]; setSettings({ ...settings, color }); updateSelected({ color }) }} /> : <span key={index} className="color-slot" aria-hidden="true" />)}<label className="custom-color" title="Añadir color personalizado"><span aria-hidden="true">+</span><input aria-label="Añadir color personalizado" type="color" value={settings.color} onChange={event => { const color = event.target.value; setCustomColors(current => addCustomColor(current, color)); setSettings({ ...settings, color }); updateSelected({ color }) }} /></label></div>
        </div>
        {(tool === 'pen' || tool === 'arrow' || tool === 'rect' || tool === 'underline' || selected?.type === 'pen' || selected?.type === 'arrow' || selected?.type === 'rect' || selected?.type === 'underline') && <><label className="control-label" htmlFor="width">Grosor: {selected?.width ?? settings.width} pt</label><input id="width" type="range" min="1" max="24" value={selected?.width ?? settings.width} onChange={event => { const width = Number(event.target.value); setSettings({ ...settings, width }); updateSelected({ width }) }} /></>}
        {(tool === 'pen' || selected) && <><label className="control-label" htmlFor="opacity">Opacidad: {Math.round((selected?.opacity ?? settings.opacity) * 100)} %</label><input id="opacity" type="range" min="10" max="100" value={(selected?.opacity ?? settings.opacity) * 100} onChange={event => { const opacity = Number(event.target.value) / 100; setSettings({ ...settings, opacity }); updateSelected({ opacity }) }} /></>}
        {(tool === 'text' || selected?.type === 'text') && <><label className="control-label" htmlFor="font-size">Tamaño de texto: {selected?.type === 'text' ? selected.fontSize : settings.fontSize} pt</label><input id="font-size" type="range" min="8" max="48" value={selected?.type === 'text' ? selected.fontSize : settings.fontSize} onChange={event => { const fontSize = Number(event.target.value); setSettings({ ...settings, fontSize }); updateSelected({ fontSize } as Partial<Annotation>) }} /></>}
        {selected?.type === 'text' && <><label className="control-label" htmlFor="selected-text">Texto seleccionado</label><textarea id="selected-text" className="side-textarea" value={selected.text} onChange={event => updateSelected({ text: event.target.value } as Partial<Annotation>)} /></>}
        <p className="sidebar-help">{tool === 'highlight' || tool === 'underline' ? 'Arrastra sobre el texto del PDF para marcar las palabras. Elige el color antes de seleccionarlas.' : tool === 'text' ? 'Mantén pulsado y arrastra para crear un cuadro de texto. Pulsa un texto existente para editarlo; arrastra su esquina para cambiar el tamaño.' : 'Haz doble clic en un texto para editarlo. Arrastra una anotación con Seleccionar para moverla.'}</p>
      </aside>
      <main className="main-area" onDragOver={event => { event.preventDefault(); setDragging(true) }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false) }} onDrop={event => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files[0]; if (file) void openFile(file) }}>
        {error && <div className="error" role="alert">{error}<button onClick={() => setError('')} aria-label="Cerrar aviso">×</button></div>}
        {document ? <><div className="viewer-controls"><div className="nav-controls"><button aria-label="Página anterior" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}>‹</button><input aria-label="Número de página" type="number" min="1" max={pageCount} value={pageInput} onChange={event => setPageInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') goToPage(Number(pageInput)) }} onBlur={() => goToPage(Number(pageInput))} /><span>de {pageCount}</span><button aria-label="Página siguiente" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= pageCount}>›</button></div><div className="zoom-controls"><span className="zoom-hint">Ctrl + rueda para zoom</span><button aria-label="Reducir zoom" onClick={() => setZoom(value => Math.max(0.25, +(value - 0.1).toFixed(2)))}>−</button><span>{Math.round(zoom * 100)} %</span><button aria-label="Aumentar zoom" onClick={() => setZoom(value => Math.min(3, +(value + 0.1).toFixed(2)))}>+</button><button className="fit-button" onClick={fitWidth}>Ajustar ancho</button><button title="Girar 90°" onClick={() => setRotation(value => (value + 90) % 360)}>↻</button></div></div><div ref={viewer} className={`viewer ${tool === 'hand' ? 'hand-mode' : ''} ${panning ? 'panning' : ''}`} onScroll={updateCurrentPage} onPointerDown={startPan} onPointerMove={movePan} onPointerUp={stopPan} onPointerCancel={stopPan} onLostPointerCapture={() => { panPoint.current = null; setPanning(false) }} onDragStart={event => { if (tool === 'hand') event.preventDefault() }}>{Array.from({ length: pageCount }, (_, i) => <PdfPage key={i + 1} document={document} number={i + 1} zoom={zoom} rotation={rotation} defaultSize={defaultSize} tool={tool} settings={settings} editingId={editingId} onEdit={onEdit} onError={setError} />)}</div></> : <div className={`empty-state ${dragging ? 'dragging' : ''}`}><div className="empty-icon">▤</div><h1>Estudia tus PDF a tu manera</h1><p>Abre un documento para dibujar, escribir y exportar tus anotaciones. Todo se procesa en tu navegador.</p><button className="button button-primary" onClick={() => fileInput.current?.click()}>Elegir un PDF</button><span>o arrástralo aquí</span></div>}
      </main>
    </div>
  </div>
}
