import { Link, useParams } from 'react-router-dom'
import { ErrorState } from '../../components/ErrorState'
import { LoadingState } from '../../components/LoadingState'
import { TopBar } from '../../components/TopBar'
import { CATEGORY_LABELS, findSubject } from '../../features/catalog/catalog-utils'
import { useCatalog } from '../../features/catalog/useCatalog'
import type { CategoryType } from '../../types/materials'

export function CategoryPage() {
  const { subjectId = '', categoryType = '' } = useParams()
  const catalog = useCatalog()

  if (catalog.isLoading) return <LoadingState />
  if (catalog.isError || !catalog.data) return <ErrorState message="Failed to load category." />

  const subject = findSubject(catalog.data.subjects, subjectId)

  if (!subject) {
    return (
      <main className="page-shell">
        <TopBar crumbs={[{ label: 'Home', to: '/' }, { label: 'Not found' }]} />
        <section className="surface">
          <p className="state-text">Subject not found.</p>
        </section>
      </main>
    )
  }

  const category = subject.categories.find((entry) => entry.type === (categoryType as CategoryType))

  return (
    <main className="page-shell">
      <TopBar
        crumbs={[
          { label: 'Home', to: '/' },
          { label: `${subject.code} - ${subject.name}`, to: `/subject/${subject.id}` },
          { label: category ? CATEGORY_LABELS[category.type] : 'Not found' },
        ]}
      />
      <section className="surface">
        <p>
          {subject.code} - {subject.name}
        </p>
        <h2>{category ? CATEGORY_LABELS[category.type] : 'Category not found'}</h2>
        {!category || category.items.length === 0 ? (
          <p className="state-text">No material found.</p>
        ) : (
          <ul className="material-list">
            {category.items.map((item) => (
              <li key={item.id} className="material-card">
                <h3>{item.title}</h3>
                <p>{item.termDateLabel ?? item.sourceHtml}</p>
                <p>{item.images.length} page(s)</p>
                <Link className="primary-btn" to={`/material/${item.id}`}>
                  Open reader
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
