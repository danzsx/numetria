import { Link, useLocation } from 'react-router';
import { LayoutDashboard, Grid3x3, History, User, Search } from 'lucide-react';

export function MobileNav() {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Módulos', path: '/modules', icon: Grid3x3 },
    { label: 'Classificar', path: '/classify', icon: Search },
    { label: 'Histórico', path: '/history', icon: History },
    { label: 'Pro', path: '/pro', icon: User }
  ];

  const isActive = (path: string) => {
    if (path === '/modules') {
      return location.pathname.startsWith('/modules');
    }
    return location.pathname === path;
  };

  // Don't show on training page
  if (location.pathname === '/training') {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--nm-bg-surface)] border-t border-[var(--nm-grid-line)] z-50">
      <div className="grid grid-cols-5 h-16">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${isActive(item.path)
                ? 'text-[var(--nm-accent-primary)]'
                : 'text-[var(--nm-text-dimmed)]'
              }`}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-[family-name:var(--font-data)] uppercase tracking-wider">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
