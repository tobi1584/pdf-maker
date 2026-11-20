// Extract geometry from selected glyphs, excluding line breaks and trailing spaces.
export function selectedTextRects(range: Range, layer: HTMLElement): DOMRect[] {
  const rectangles: DOMRect[] = []
  const walker = document.createTreeWalker(layer, NodeFilter.SHOW_TEXT)
  let node: Node | null
  while ((node = walker.nextNode())) {
    if (!range.intersectsNode(node) || !node.textContent) continue
    const text = node.textContent
    const fragment = range.cloneRange()
    if (range.comparePoint(node, 0) === 0) fragment.setStart(node, 0)
    if (range.comparePoint(node, text.length) === 0) fragment.setEnd(node, text.length)
    if (fragment.startContainer !== node || fragment.endContainer !== node) continue
    let start = fragment.startOffset
    let end = fragment.endOffset
    while (start < end && /\s/u.test(text[start])) start++
    while (end > start && /\s/u.test(text[end - 1])) end--
    if (start === end) continue
    fragment.setStart(node, start)
    fragment.setEnd(node, end)
    rectangles.push(...Array.from(fragment.getClientRects()).filter(rect => rect.width > 2 && rect.height > 2))
  }
  return rectangles
}
