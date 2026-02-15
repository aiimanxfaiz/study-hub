import { Link, useParams } from 'react-router-dom'
import { ErrorState } from '../../components/ErrorState'
import { LoadingState } from '../../components/LoadingState'
import { TopBar } from '../../components/TopBar'
import { CATEGORY_LABELS, findSubject } from '../../features/catalog/catalog-utils'
import { useCatalog } from '../../features/catalog/useCatalog'

export function SubjectPage() {
  const { subjectId = '' } = useParams()
  const catalog = useCatalog()

  if (catalog.isLoading) return <LoadingState />
  if (catalog.isError || !catalog.data) return <ErrorState message="Failed to load subject." />

  const subject = findSubject(catalog.data.subjects, subjectId)

  if (!subject) {
    return (
      <main className="page-shell">
        <TopBar crumbs={[{ label: 'Home', to: '/' }, { label: 'Not found' }]} />
        <section className="surface">
          <p className="state-text">Subject not found.</p>
          <Link className="primary-btn" to="/">
            Back home
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <TopBar crumbs={[{ label: 'Home', to: '/' }, { label: subject.code }]} />
      <section className="surface">
        <h2>{subject.code}</h2>
        <p>{subject.name}</p>
        <div className="cards-grid">
          {subject.categories.map((category) => (
            <article className="subject-card" key={category.type}>
              <h3>{CATEGORY_LABELS[category.type]}</h3>
              <p>{category.items.length} material(s)</p>
              <Link className="primary-btn" to={`/subject/${subject.id}/${category.type}`}>
                View category
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
