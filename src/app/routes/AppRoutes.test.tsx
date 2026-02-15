import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppRoutes } from './AppRoutes'

const fakeData = {
  subjects: [
    {
      id: 'tsn-2201',
      code: 'TSN 2201',
      name: 'Computer Networks',
      categories: [
        {
          type: 'exam',
          title: 'Exam Papers',
          items: [
            {
              id: 'item-1',
              title: 'Trimester 1, 2021',
              sourceHtml: 'TSN 2201/Exams.html',
              tags: ['exam'],
              images: [
                { src: 'TSN 2201/Images/Exams/1.png', alt: 'Page 1', pageNo: 1 },
                { src: 'TSN 2201/Images/Exams/2.png', alt: 'Page 2', pageNo: 2 },
              ],
            },
          ],
        },
      ],
    },
  ],
}

function renderApp(initialEntries: string[]) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <AppRoutes />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('App routes', () => {
  it('renders home with subjects', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => fakeData })) as unknown as typeof fetch,
    )

    renderApp(['/'])

    await waitFor(() => {
      expect(screen.getByText('Subjects')).toBeInTheDocument()
      expect(screen.getAllByText('TSN 2201').length).toBeGreaterThan(0)
    })
  })

  it('opens material page and handles keyboard navigation', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => fakeData })) as unknown as typeof fetch,
    )

    renderApp(['/material/item-1'])

    await waitFor(() => {
      expect(screen.getByText('1/2')).toBeInTheDocument()
    })

    fireEvent.keyDown(window, { key: 'ArrowRight' })

    await waitFor(() => {
      expect(screen.getByText('2/2')).toBeInTheDocument()
    })
  })
})
