import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import ConnectionGraph, {
  type GraphConnection,
} from '../components/ConnectionGraph'
import { categoryColor } from '../utils/categoryColor'
import type { ConnectionType, Technique } from '../types'

function makeTechnique(id: number, name: string, categoryId = 1): Technique {
  return {
    id,
    name,
    description: '',
    cues: [],
    categoryId,
    youtubeUrl: '',
    difficulty: 'BEGINNER',
    isCustom: false,
  }
}

function conn(
  id: number,
  name: string,
  connectionType: ConnectionType,
  direction: 'from' | 'to',
  categoryId = 1,
): GraphConnection {
  return {
    technique: makeTechnique(id, name, categoryId),
    connectionType,
    direction,
  }
}

const typeName = (t: ConnectionType) => t

describe('ConnectionGraph', () => {
  it('renders nothing when there are no connections', () => {
    const { container } = render(
      <ConnectionGraph
        centerName="Closed Guard"
        centerCategoryId={1}
        connections={[]}
        onSelect={vi.fn()}
        connectionTypeName={typeName}
      />,
    )
    expect(container.querySelector('svg')).toBeNull()
  })

  it('renders the centre technique name', () => {
    const { container } = render(
      <ConnectionGraph
        centerName="Mount"
        centerCategoryId={1}
        connections={[conn(2, 'Armbar', 'FOLLOW_UP', 'from')]}
        onSelect={vi.fn()}
        connectionTypeName={typeName}
      />,
    )
    expect(container.querySelector('svg > text')?.textContent).toContain(
      'Mount',
    )
  })

  it('renders one clickable node per unique neighbour', () => {
    const { container } = render(
      <ConnectionGraph
        centerName="Closed Guard"
        centerCategoryId={1}
        connections={[
          conn(2, 'Armbar', 'FOLLOW_UP', 'from'),
          conn(3, 'Triangle', 'FOLLOW_UP', 'from'),
        ]}
        onSelect={vi.fn()}
        connectionTypeName={typeName}
      />,
    )
    expect(container.querySelectorAll('g[role="button"]')).toHaveLength(2)
  })

  it('merges a neighbour linked by multiple connections into a single node', () => {
    const { container } = render(
      <ConnectionGraph
        centerName="Closed Guard"
        centerCategoryId={1}
        connections={[
          conn(2, 'Armbar', 'FOLLOW_UP', 'from'),
          conn(2, 'Armbar', 'COUNTER', 'to'),
        ]}
        onSelect={vi.fn()}
        connectionTypeName={typeName}
      />,
    )
    expect(container.querySelectorAll('g[role="button"]')).toHaveLength(1)
  })

  it('calls onSelect with the technique id when a neighbour node is clicked', () => {
    const onSelect = vi.fn()
    const { container } = render(
      <ConnectionGraph
        centerName="Closed Guard"
        centerCategoryId={1}
        connections={[conn(42, 'Armbar', 'FOLLOW_UP', 'from')]}
        onSelect={onSelect}
        connectionTypeName={typeName}
      />,
    )
    fireEvent.click(container.querySelector('g[role="button"]')!)
    expect(onSelect).toHaveBeenCalledWith(42)
  })

  it('calls onSelect when Enter is pressed on a node', () => {
    const onSelect = vi.fn()
    const { container } = render(
      <ConnectionGraph
        centerName="Closed Guard"
        centerCategoryId={1}
        connections={[conn(7, 'Armbar', 'FOLLOW_UP', 'from')]}
        onSelect={onSelect}
        connectionTypeName={typeName}
      />,
    )
    fireEvent.keyDown(container.querySelector('g[role="button"]')!, {
      key: 'Enter',
    })
    expect(onSelect).toHaveBeenCalledWith(7)
  })

  it('renders a legend entry for each connection type present', () => {
    const { getByText, queryByText } = render(
      <ConnectionGraph
        centerName="Closed Guard"
        centerCategoryId={1}
        connections={[
          conn(2, 'Armbar', 'FOLLOW_UP', 'from'),
          conn(3, 'Scissor Sweep', 'SETUP', 'to'),
          conn(4, 'Hip Bump', 'FOLLOW_UP', 'from'),
        ]}
        onSelect={vi.fn()}
        connectionTypeName={(t) => (t === 'FOLLOW_UP' ? 'Follow-up' : 'Setup')}
      />,
    )
    expect(getByText('Follow-up')).toBeInTheDocument()
    expect(getByText('Setup')).toBeInTheDocument()
    expect(queryByText('Counter')).toBeNull()
  })

  it('truncates long technique names but keeps the full name in a title element', () => {
    const longName = 'Berimbolo to Back Take Sequence'
    const { container } = render(
      <ConnectionGraph
        centerName="Closed Guard"
        centerCategoryId={1}
        connections={[conn(2, longName, 'FOLLOW_UP', 'from')]}
        onSelect={vi.fn()}
        connectionTypeName={typeName}
      />,
    )
    const node = container.querySelector('g[role="button"]')!
    const label = node.querySelector('text')!
    expect(label.firstChild?.textContent).toContain('…')
    expect(label.firstChild!.textContent!.length).toBeLessThan(longName.length)
    expect(node.querySelector('title')?.textContent).toBe(longName)
  })

  it('points the arrowhead at the neighbour for outgoing (from) connections', () => {
    const { container } = render(
      <ConnectionGraph
        centerName="Closed Guard"
        centerCategoryId={1}
        connections={[conn(2, 'Armbar', 'FOLLOW_UP', 'from')]}
        onSelect={vi.fn()}
        connectionTypeName={typeName}
      />,
    )
    const line = container.querySelector('line')!
    expect(line.getAttribute('marker-end')).toBeTruthy()
    expect(line.getAttribute('marker-start')).toBeNull()
  })

  it('points the arrowhead at the centre for incoming (to) connections', () => {
    const { container } = render(
      <ConnectionGraph
        centerName="Closed Guard"
        centerCategoryId={1}
        connections={[conn(2, 'Armbar', 'COUNTER', 'to')]}
        onSelect={vi.fn()}
        connectionTypeName={typeName}
      />,
    )
    const line = container.querySelector('line')!
    expect(line.getAttribute('marker-start')).toBeTruthy()
    expect(line.getAttribute('marker-end')).toBeNull()
  })

  it('draws an edge for every unique neighbour', () => {
    const { container } = render(
      <ConnectionGraph
        centerName="Closed Guard"
        centerCategoryId={1}
        connections={[
          conn(2, 'Armbar', 'FOLLOW_UP', 'from'),
          conn(3, 'Triangle', 'COUNTER', 'to'),
          conn(4, 'Omoplata', 'TRANSITION', 'from'),
        ]}
        onSelect={vi.fn()}
        connectionTypeName={typeName}
      />,
    )
    expect(container.querySelectorAll('line')).toHaveLength(3)
  })

  it('colours nodes by the category of their technique', () => {
    const { container } = render(
      <ConnectionGraph
        centerName="Closed Guard"
        centerCategoryId={3}
        connections={[conn(2, 'Armbar', 'FOLLOW_UP', 'from', 4)]}
        onSelect={vi.fn()}
        connectionTypeName={typeName}
      />,
    )
    // First <circle> is the centre node, stroked with its category colour.
    const centre = container.querySelector('svg > circle')!
    expect(centre.getAttribute('stroke')).toBe(categoryColor(3))
    // The neighbour node circle is stroked with its own category colour.
    const neighbourCircle = container.querySelector('g[role="button"] circle')!
    expect(neighbourCircle.getAttribute('stroke')).toBe(categoryColor(4))
  })
})
