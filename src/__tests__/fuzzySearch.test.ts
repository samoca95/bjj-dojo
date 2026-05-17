import { describe, expect, it } from 'vitest'
import {
  flowMatchesQuery,
  flowScore,
  fuzzyMatch,
  techniqueMatchesQuery,
} from '../utils/fuzzySearch'
import type { Flow } from '../types'

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

describe('flowMatchesQuery / flowScore', () => {
  const techniqueNames: Record<number, string> = {
    101: 'Closed Guard',
    405: 'Rear Naked Choke',
    512: 'Arm Drag to Back Take',
  }
  const lookup = (id: number) => techniqueNames[id] ?? ''

  const flow: Flow = {
    id: 1,
    name: 'Back attack flow',
    description: 'Climb to the back and finish',
    tags: ['back-attack', 'fundamentals'],
    isCustom: true,
    createdAt: 0,
    updatedAt: 0,
    rootNodeId: 'a',
    nodes: [
      {
        id: 'a',
        techniqueId: 512,
        note: 'Trap the wrist, pinch the tricep',
        childIds: ['b'],
      },
      { id: 'b', techniqueId: 405, childIds: [] },
    ],
  }

  it('matches the flow name', () => {
    expect(flowMatchesQuery(flow, lookup, 'back attack')).toBe(true)
  })

  it('matches a referenced technique name', () => {
    expect(flowMatchesQuery(flow, lookup, 'rear naked')).toBe(true)
  })

  it('matches a node note', () => {
    expect(flowMatchesQuery(flow, lookup, 'tricep')).toBe(true)
  })

  it('matches a tag', () => {
    expect(flowMatchesQuery(flow, lookup, 'fundamentals')).toBe(true)
  })

  it('returns false for unrelated queries', () => {
    expect(flowMatchesQuery(flow, lookup, 'spider lasso')).toBe(false)
  })

  it('scores name match higher than note match', () => {
    expect(flowScore(flow, lookup, 'back attack')).toBeGreaterThan(
      flowScore(flow, lookup, 'tricep'),
    )
  })

  it('scores technique-name match above note match', () => {
    expect(flowScore(flow, lookup, 'rear naked')).toBeGreaterThan(
      flowScore(flow, lookup, 'tricep'),
    )
  })
})
