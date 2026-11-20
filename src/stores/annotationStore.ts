import { create } from 'zustand'
import type { Annotation } from '../types/annotations'

type State = {
  annotations: Annotation[]
  past: Annotation[][]
  future: Annotation[][]
  selectedId: string | null
  reset: (annotations?: Annotation[]) => void
  select: (id: string | null) => void
  commit: (annotations: Annotation[]) => void
  preview: (annotations: Annotation[]) => void
  finishPreview: (previous: Annotation[]) => void
  undo: () => void
  redo: () => void
}

export const useAnnotationStore = create<State>((set, get) => ({
  annotations: [], past: [], future: [], selectedId: null,
  reset: (annotations = []) => set({ annotations, past: [], future: [], selectedId: null }),
  select: selectedId => set({ selectedId }),
  commit: annotations => {
    const state = get()
    if (JSON.stringify(annotations) === JSON.stringify(state.annotations)) return
    set({ annotations, past: [...state.past.slice(-49), state.annotations], future: [] })
  },
  preview: annotations => set({ annotations }),
  finishPreview: previous => {
    const state = get()
    if (JSON.stringify(previous) === JSON.stringify(state.annotations)) return
    set({ past: [...state.past.slice(-49), previous], future: [] })
  },
  undo: () => {
    const { past, future, annotations } = get()
    if (!past.length) return
    set({ annotations: past[past.length - 1], past: past.slice(0, -1), future: [annotations, ...future], selectedId: null })
  },
  redo: () => {
    const { past, future, annotations } = get()
    if (!future.length) return
    set({ annotations: future[0], past: [...past, annotations], future: future.slice(1), selectedId: null })
  },
}))
