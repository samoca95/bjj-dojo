import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import IconPickerModal from '../components/IconPickerModal'

function renderModal(value?: string, onSelect = vi.fn(), onClose = vi.fn()) {
  return render(
    <IconPickerModal title="Pick an icon" value={value} onSelect={onSelect} onClose={onClose} />,
  )
}

describe('IconPickerModal — structure', () => {
  it('renders the title', () => {
    renderModal()
    expect(screen.getByText('Pick an icon')).toBeInTheDocument()
  })

  it('renders Icons and Emoji tabs', () => {
    renderModal()
    expect(screen.getByText('Icons')).toBeInTheDocument()
    expect(screen.getByText('Emoji')).toBeInTheDocument()
  })

  it('shows Suggested section by default (no search)', () => {
    renderModal()
    expect(screen.getByText('Suggested')).toBeInTheDocument()
    expect(screen.getByText(/All Icons/)).toBeInTheDocument()
  })

  it('renders Done and Clear buttons', () => {
    renderModal()
    expect(screen.getByText('Done')).toBeInTheDocument()
    expect(screen.getByText('Clear')).toBeInTheDocument()
  })
})

describe('IconPickerModal — icon tab', () => {
  it('has a search input', () => {
    renderModal()
    expect(screen.getByPlaceholderText('Search all icons…')).toBeInTheDocument()
  })

  it('hides Suggested/All sections when search is active', async () => {
    const user = userEvent.setup()
    renderModal()
    await user.type(screen.getByPlaceholderText('Search all icons…'), 'shield')
    expect(screen.queryByText('Suggested')).toBeNull()
    expect(screen.queryByText(/All Icons/)).toBeNull()
  })

  it('calls onSelect with icon id when an icon is clicked', async () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderModal(undefined, onSelect, onClose)
    // Click the first icon button in suggested (Shield) — use getAllByText since it also appears in the all-icons grid
    const shieldBtns = screen.getAllByText('Shield')
    const shieldBtn = shieldBtns[0].closest('button')!
    await user.click(shieldBtn)
    expect(onSelect).toHaveBeenCalledWith('shield')
    expect(onClose).toHaveBeenCalled()
  })

  it('highlights the currently selected icon', () => {
    renderModal('shield')
    const shieldBtns = screen.getAllByText('Shield')
    const shieldBtn = shieldBtns[0].closest('button')!
    expect(shieldBtn.className).toContain('border-gold')
  })

  it('calls onSelect with empty string when Clear is clicked', async () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderModal('shield', onSelect, onClose)
    await user.click(screen.getByText('Clear'))
    expect(onSelect).toHaveBeenCalledWith('')
    expect(onClose).toHaveBeenCalled()
  })
})

describe('IconPickerModal — emoji tab', () => {
  it('switches to emoji tab', async () => {
    const user = userEvent.setup()
    renderModal()
    await user.click(screen.getByText('Emoji'))
    expect(screen.getByPlaceholderText('e.g. 🥋')).toBeInTheDocument()
    expect(screen.getByText('Suggestions')).toBeInTheDocument()
  })

  it('can select a suggested emoji', async () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderModal(undefined, onSelect, onClose)
    await user.click(screen.getByText('Emoji'))
    // Click the first emoji suggestion (🥋)
    await user.click(screen.getByText('🥋'))
    expect(onSelect).toHaveBeenCalledWith('🥋')
    expect(onClose).toHaveBeenCalled()
  })

  it('Use button applies custom emoji input', async () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderModal(undefined, onSelect, onClose)
    await user.click(screen.getByText('Emoji'))
    await user.type(screen.getByPlaceholderText('e.g. 🥋'), '🦾')
    await user.click(screen.getByText('Use'))
    expect(onSelect).toHaveBeenCalledWith('🦾')
    expect(onClose).toHaveBeenCalled()
  })
})
