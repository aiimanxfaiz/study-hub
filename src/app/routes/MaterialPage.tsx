import { Link, useParams } from 'react-router-dom'
import { ErrorState } from '../../components/ErrorState'
import { LoadingState } from '../../components/LoadingState'
import { TopBar } from '../../components/TopBar'
import { CATEGORY_LABELS } from '../../features/catalog/catalog-utils'
import { useCatalog } from '../../features/catalog/useCatalog'
import { MaterialViewer } from '../../features/viewer/MaterialViewer'

export function MaterialPage() {
  const { materialId = '' } = useParams()
  const catalog = useCatalog()

  if (catalog.isLoading) return <LoadingState />
  if (catalog.isError || !catalog.data) return <ErrorState message="Failed to load material." />

  const match = catalog.data.materialById.get(materialId)

  if (!match) {
    return (
      <main className="page-shell">
        <TopBar crumbs={[{ label: 'Home', to: '/' }, { label: 'Material not found' }]} />
        <section className="surface">
          <p className="state-text">Material not found.</p>
          <Link className="primary-btn" to="/">
            Back home
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <TopBar
        crumbs={[
          { label: 'Home', to: '/' },
          { label: match.subjectCode, to: `/subject/${match.subjectId}` },
          { label: CATEGORY_LABELS[match.categoryType], to: `/subject/${match.subjectId}/${match.categoryType}` },
          { label: match.item.title },
        ]}
      />

      <section className="surface">
        <h2>{match.item.title}</h2>
        <p>
          {match.subjectCode} · {CATEGORY_LABELS[match.categoryType]}
          {match.item.termDateLabel ? ` · ${match.item.termDateLabel}` : ''}
        </p>
        <p>Source: {match.item.sourceHtml ?? 'Unknown source'}</p>
      </section>

      <section className="surface">
        <MaterialViewer title={match.item.title} images={match.item.images} />
      </section>

      {match.item.textBlocks && match.item.textBlocks.length > 0 ? (
        <section className="surface">
          <h3>Extracted text blocks</h3>
          <div className="text-blocks">
            {match.item.textBlocks.map((block, idx) => (
              <pre key={`${match.item.id}-${idx}`}>{block}</pre>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}
