import type { ReactNode } from 'react'
import type { Tool } from '../types/annotations'

const paths: Record<Tool, ReactNode> = {
  select: <><path d="m5 3 11 9-5 .5-2.5 4.5L5 3Z" /><path d="m11 12.5 3 5" /></>,
  hand: <><path d="M7 11V5a1 1 0 0 1 2 0v5-6a1 1 0 0 1 2 0v6-5a1 1 0 0 1 2 0v5-3a1 1 0 0 1 2 0v5l1-1a1.5 1.5 0 0 1 2 2l-3.2 4.2A4 4 0 0 1 11.6 19H9a4 4 0 0 1-3.3-1.7L3 13.5a1.5 1.5 0 0 1 2.2-2L7 13" /></>,
  highlight: <><path d="m5 14 7.5-9 3.5 3-7.5 9H5v-3Z" /><path d="m11 7 3.5 3M3 19h15" /></>,
  underline: <><path d="M5 4v7a5 5 0 0 0 10 0V4M3 19h14" /></>,
  pen: <><path d="m4 16 10-11 3 3L7 19H4v-3ZM12 7l3 3M3 21h16" /></>,
  text: <><path d="M4 5h14M11 5v14M7 19h8M4 5v3M18 5v3" /></>,
  arrow: <><path d="M4 17 17 4M10 4h7v7" /></>,
  rect: <rect x="4" y="5" width="14" height="13" rx="1" />,
  eraser: <><path d="m8 5 10 10-4 4H8l-5-5a2 2 0 0 1 0-3l6-6a2 2 0 0 1 3 0M6 17h12" /></>,
}

export function ToolIcon({ tool }: { tool: Tool }) {
  return <svg viewBox="0 0 22 22" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[tool]}</svg>
}

export function ActionIcon({ action }: { action: 'undo' | 'redo' }) {
  return <svg viewBox="0 0 22 22" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {action === 'undo' ? <><path d="M8 7 4 11l4 4" /><path d="M4 11h9a5 5 0 0 1 0 10" /></> : <><path d="m14 7 4 4-4 4" /><path d="M18 11H9a5 5 0 0 0 0 10" /></>}
  </svg>
}
