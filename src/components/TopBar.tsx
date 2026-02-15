import { Link } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'

export interface Crumb {
  label: string
  to?: string
}

interface TopBarProps {
  crumbs: Crumb[]
}

export function TopBar({ crumbs }: TopBarProps) {
  return (
    <header className="topbar" role="banner">
      <div className="topbar-inner">
        <div className="brand">
          <Link to="/" className="brand-link">
            Study Hub v2
          </Link>
          <p className="brand-sub">Comfort-first material reader</p>
        </div>
        <ThemeToggle />
      </div>
      <nav aria-label="Breadcrumb" className="crumbs">
        {crumbs.map((crumb, idx) => (
          <span key={`${crumb.label}-${idx}`}>
            {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <span>{crumb.label}</span>}
            {idx < crumbs.length - 1 ? <span className="crumb-sep">/</span> : null}
          </span>
        ))}
      </nav>
    </header>
  )
}
