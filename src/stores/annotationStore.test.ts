import { describe, expect, it } from 'vitest'
import { useAnnotationStore } from './annotationStore'
import type { Annotation } from '../types/annotations'

describe('historial de anotaciones', () => {
  it('deshace y rehace una operación completa', () => {
    const annotation: Annotation = { id: 'a', page: 1, type: 'rect', start: { x: 10, y: 20 }, end: { x: 90, y: 60 }, color: '#000000', width: 2, opacity: 1 }
    const store = useAnnotationStore.getState()
    store.reset()
    store.commit([annotation])
    expect(useAnnotationStore.getState().annotations).toEqual([annotation])
    useAnnotationStore.getState().undo()
    expect(useAnnotationStore.getState().annotations).toEqual([])
    useAnnotationStore.getState().redo()
    expect(useAnnotationStore.getState().annotations).toEqual([annotation])
    useAnnotationStore.getState().reset()
  })
})
