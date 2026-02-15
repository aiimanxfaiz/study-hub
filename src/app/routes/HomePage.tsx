import { Link } from 'react-router-dom'
import { ErrorState } from '../../components/ErrorState'
import { LoadingState } from '../../components/LoadingState'
import { TopBar } from '../../components/TopBar'
import { CATEGORY_LABELS, categoryCount } from '../../features/catalog/catalog-utils'
import { useCatalog } from '../../features/catalog/useCatalog'
import { useSearch } from '../../features/search/useSearch'
import type { CategoryType } from '../../types/materials'

const FILTER_CATEGORIES: CategoryType[] = ['lecture', 'tutorial', 'test', 'exam', 'notes', 'lab', 'quiz', 'other']

export function HomePage() {
  const catalog = useCatalog()
  const subjects = catalog.data?.subjects ?? []
  const materials = catalog.data?.materials ?? []
  const search = useSearch(materials)

  if (catalog.isLoading) return <LoadingState />
  if (catalog.isError || !catalog.data) return <ErrorState message="Failed to load materials catalog." />

  return (
    <main className="page-shell">
      <TopBar crumbs={[{ label: 'Home' }]} />

      <section className="surface search-surface" aria-label="Search filters">
        <h2>Find any material fast</h2>
        <div className="filter-grid">
          <input
            type="search"
            className="input"
            placeholder="Search subject, paper, topic..."
            value={search.state.query}
            onChange={(event) => search.setState((prev) => ({ ...prev, query: event.target.value }))}
            aria-label="Search study materials"
          />

          <select
            className="input"
            value={search.state.subjectId}
            onChange={(event) => search.setState((prev) => ({ ...prev, subjectId: event.target.value }))}
            aria-label="Filter by subject"
          >
            <option value="">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.code}
              </option>
            ))}
          </select>

          <select
            className="input"
            value={search.state.categoryType}
            onChange={(event) =>
              search.setState((prev) => ({
                ...prev,
                categoryType: event.target.value as '' | CategoryType,
              }))
            }
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {FILTER_CATEGORIES.map((type) => (
              <option key={type} value={type}>
                {CATEGORY_LABELS[type]}
              </option>
            ))}
          </select>

          <select
            className="input"
            value={search.state.sort}
            onChange={(event) => search.setState((prev) => ({ ...prev, sort: event.target.value as 'relevance' | 'title' }))}
            aria-label="Sort search results"
          >
            <option value="relevance">Sort by relevance</option>
            <option value="title">Sort by title</option>
          </select>
        </div>
      </section>

      <section className="surface" aria-label="Subject cards">
        <h2>Subjects</h2>
        <div className="cards-grid">
          {subjects.map((subject) => (
            <article key={subject.id} className="subject-card">
              <h3>{subject.code}</h3>
              <p>{subject.name}</p>
              <ul className="pill-row">
                <li>Lectures: {categoryCount(subject, 'lecture')}</li>
                <li>Tutorials: {categoryCount(subject, 'tutorial')}</li>
                <li>Tests: {categoryCount(subject, 'test')}</li>
                <li>Exams: {categoryCount(subject, 'exam')}</li>
              </ul>
              <Link className="primary-btn" to={`/subject/${subject.id}`}>
                Open subject
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="surface" aria-label="Search results">
        <h2>Results ({search.results.length})</h2>
        {search.results.length === 0 ? (
          <p className="state-text">No material found. Adjust your filters.</p>
        ) : (
          <ul className="result-list">
            {search.results.slice(0, 120).map((result) => (
              <li key={result.item.id}>
                <Link to={`/material/${result.item.id}`}>
                  <strong>{result.item.title}</strong> · {result.subjectCode} · {CATEGORY_LABELS[result.categoryType]}
                  {result.item.termDateLabel ? ` · ${result.item.termDateLabel}` : ''}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
