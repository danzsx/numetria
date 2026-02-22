import { Link } from 'react-router'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-[11px] font-[family-name:var(--font-data)] text-[var(--nm-text-annotation)] uppercase tracking-[0.1em]">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="opacity-40">›</span>}
          {item.href ? (
            <Link
              to={item.href}
              className="hover:text-[var(--nm-text-dimmed)] transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-[var(--nm-text-dimmed)]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
