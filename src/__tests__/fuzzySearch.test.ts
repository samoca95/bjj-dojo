import { describe, expect, it } from 'vitest'
import { fuzzyMatch, techniqueMatchesQuery } from '../utils/fuzzySearch'

describe('fuzzySearch', () => {
  it('matches direct substring', () => {
    expect(fuzzyMatch('Armbar from guard', 'arm')).toBe(true)
  })

  it('matches fuzzy subsequence', () => {
    expect(fuzzyMatch('Closed Guard', 'clgrd')).toBe(true)
  })

  it('ignores accents and case', () => {
    expect(fuzzyMatch('Técnica Avanzada', 'tecnica')).toBe(true)
  })

  it('matches technique description as part of query target', () => {
    const technique = {
      id: 1,
      name: 'Loop Choke',
      description: 'Fast collar choke from standing exchange',
      cues: [],
      categoryId: 4,
      youtubeUrl: '',
      difficulty: 'INTERMEDIATE' as const,
      isCustom: false,
    }
    expect(techniqueMatchesQuery(technique, 'collar standing')).toBe(true)
  })
})
