import { Link } from 'react-router-dom'
import { TopBar } from '../../components/TopBar'

export function NotFoundPage() {
  return (
    <main className="page-shell">
      <TopBar crumbs={[{ label: 'Home', to: '/' }, { label: 'Not found' }]} />
      <section className="surface">
        <h2>Page not found</h2>
        <p className="state-text">The route does not exist.</p>
        <Link className="primary-btn" to="/">
          Go home
        </Link>
      </section>
    </main>
  )
}
