import { describe, it, expect } from 'vitest'
import { categoryColor, CATEGORY_PALETTE_SIZE } from '../utils/categoryColor'

describe('categoryColor', () => {
  it('returns a hex colour string', () => {
    expect(categoryColor(1)).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('is deterministic for the same id', () => {
    expect(categoryColor(3)).toBe(categoryColor(3))
  })

  it('assigns a distinct colour to each of the seven prefilled categories', () => {
    const colours = [1, 2, 3, 4, 5, 6, 7].map(categoryColor)
    expect(new Set(colours).size).toBe(7)
  })

  it('wraps around the palette for ids beyond its size', () => {
    expect(categoryColor(1 + CATEGORY_PALETTE_SIZE)).toBe(categoryColor(1))
  })

  it('handles zero and negative ids without throwing', () => {
    expect(categoryColor(0)).toMatch(/^#[0-9a-f]{6}$/i)
    expect(categoryColor(-1)).toMatch(/^#[0-9a-f]{6}$/i)
  })
})
