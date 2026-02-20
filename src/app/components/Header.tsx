import { Link, useLocation, useNavigate } from 'react-router';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export function Header() {
  const { user, signOut } = useAuth();
  const isLoggedIn = !!user;
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = isLoggedIn
    ? [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Módulos', path: '/modules' },
        { label: 'Histórico', path: '/history' },
        { label: 'Protocolo', path: '/pro' }
      ]
    : [];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--nm-grid-line)] bg-[var(--nm-bg-main)]/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link 
          to={isLoggedIn ? '/dashboard' : '/'} 
          className="text-[var(--nm-text-high)] font-[family-name:var(--font-data)] text-lg tracking-tight hover:text-[var(--nm-accent-primary)] transition-colors"
        >
          NUMETRIA
        </Link>

        {isLoggedIn && (
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  text-sm font-medium transition-colors
                  ${isActive(item.path) 
                    ? 'text-[var(--nm-text-high)]' 
                    : 'text-[var(--nm-text-dimmed)] hover:text-[var(--nm-text-high)]'
                  }
                `}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <Link
                to="/pro"
                className="hidden md:block px-4 py-2 text-sm text-[var(--nm-text-dimmed)] hover:text-[var(--nm-accent-primary)] transition-colors"
              >
                Upgrade
              </Link>
              <button
                onClick={handleSignOut}
                title="Sair"
                className="hidden md:flex w-8 h-8 rounded-full bg-[var(--nm-bg-surface)] items-center justify-center hover:bg-red-500/10 transition-colors group"
              >
                <LogOut size={15} className="text-[var(--nm-text-dimmed)] group-hover:text-red-400" />
              </button>
              
              {/* Mobile menu button */}
              <button 
                className="md:hidden w-8 h-8 flex items-center justify-center text-[var(--nm-text-high)]"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm text-[var(--nm-text-dimmed)] hover:text-[var(--nm-text-high)] transition-colors"
              >
                Entrar
              </Link>
              <Link to="/signup">
                <button className="px-6 py-2 bg-[var(--nm-accent-primary)] text-[var(--nm-text-high)] rounded-[var(--radius-technical)] hover:bg-[#4A82FF] transition-colors text-sm">
                  Criar conta
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {isLoggedIn && mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--nm-grid-line)] bg-[var(--nm-bg-main)]">
          <nav className="px-6 py-4 space-y-4">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  block text-sm font-medium transition-colors
                  ${isActive(item.path) 
                    ? 'text-[var(--nm-text-high)]' 
                    : 'text-[var(--nm-text-dimmed)]'
                  }
                `}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
              className="block text-sm font-medium text-[var(--nm-text-dimmed)] hover:text-red-400 transition-colors"
            >
              Sair
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}