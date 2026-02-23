import { Link } from 'react-router';

export function Footer() {
  return (
    <footer className="border-t border-[var(--nm-grid-line)] mt-24">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="text-[var(--nm-text-high)] font-[family-name:var(--font-data)] text-sm mb-3">
              NUMETRIA
            </div>
            <p className="text-[var(--nm-text-dimmed)] text-sm leading-relaxed">
              Confiança cognitiva mensurável construída por método.
            </p>
          </div>

          <div>
            <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-3">
              PRODUTO
            </div>
            <div className="space-y-2">
              <Link to="/dashboard" className="block text-sm text-[var(--nm-text-dimmed)] hover:text-[var(--nm-text-high)] transition-colors">
                Dashboard
              </Link>
              <Link to="/modules" className="block text-sm text-[var(--nm-text-dimmed)] hover:text-[var(--nm-text-high)] transition-colors">
                Módulos
              </Link>
              <Link to="/pro" className="block text-sm text-[var(--nm-text-dimmed)] hover:text-[var(--nm-text-high)] transition-colors">
                Protocolo Pro
              </Link>
            </div>
          </div>

          <div>
            <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-3">
              INSTITUCIONAL
            </div>
            <div className="space-y-2">
              <Link to="/manifesto" className="block text-sm text-[var(--nm-text-dimmed)] hover:text-[var(--nm-text-high)] transition-colors">
                Manifesto
              </Link>
              <Link to="/method" className="block text-sm text-[var(--nm-text-dimmed)] hover:text-[var(--nm-text-high)] transition-colors">
                Método
              </Link>
              <a href="#" className="block text-sm text-[var(--nm-text-dimmed)] hover:text-[var(--nm-text-high)] transition-colors">
                Privacidade
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--nm-grid-line)] text-center">
          <p className="text-[var(--nm-text-annotation)] text-xs font-[family-name:var(--font-data)]">
            © 2026 NUMETRIA — Treino constrói precisão.
          </p>
        </div>
      </div>
    </footer>
  );
}
