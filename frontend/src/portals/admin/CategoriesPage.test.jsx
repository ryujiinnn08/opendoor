import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoutes } from '../../test/renderWithProviders.jsx'
import CategoriesPage from './CategoriesPage.jsx'

vi.mock('../../api/masterData.js', () => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}))

const { getCategories, deleteCategory } = await import('../../api/masterData.js')

describe('CategoriesPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('explains why a category in use cannot be deleted', async () => {
    getCategories.mockResolvedValue([{ id: 1, name: 'Healthcare' }])
    deleteCategory.mockRejectedValue({
      response: {
        status: 422,
        data: { errors: { category: ['"Healthcare" is used by job postings, so it can\'t be deleted. Rename it instead.'] } },
      },
    })
    renderRoutes([{ path: '/', element: <CategoriesPage /> }])

    await userEvent.click(await screen.findByRole('button', { name: 'Delete Healthcare' }))
    await userEvent.click(screen.getByRole('button', { name: 'Delete category' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('is used by job postings')
    expect(screen.getByText('Healthcare')).toBeInTheDocument()
  })

  it('keeps the delete dialog open while deleting, then explains a refusal', async () => {
    let refuse
    getCategories.mockResolvedValue([{ id: 1, name: 'Healthcare' }])
    deleteCategory.mockReturnValue(new Promise((resolve, reject) => (refuse = reject)))
    renderRoutes([{ path: '/', element: <CategoriesPage /> }])

    await userEvent.click(await screen.findByRole('button', { name: 'Delete Healthcare' }))
    await userEvent.click(screen.getByRole('button', { name: 'Delete category' }))
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('dialog', { name: 'Delete "Healthcare"?' })).toBeInTheDocument()

    await act(async () =>
      refuse({ response: { status: 422, data: { errors: { category: ['"Healthcare" is used by job postings.'] } } } }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('is used by job postings')
  })
})
