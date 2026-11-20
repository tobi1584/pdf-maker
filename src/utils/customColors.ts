export const MAX_CUSTOM_COLORS = 5

export function addCustomColor(colors: string[], color: string): string[] {
  if (colors.includes(color)) return colors
  return [...colors, color].slice(-MAX_CUSTOM_COLORS)
}

export function readCustomColors(): string[] {
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem('apuntespdf-custom-colors') ?? '[]')
    if (!Array.isArray(saved)) return []
    return saved.filter((color): color is string => typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)).slice(-MAX_CUSTOM_COLORS)
  } catch {
    return []
  }
}
