import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../../contexts/AuthContext'

export default function ProtectedLayout() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--nm-bg-main)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-6 h-6 border-2 border-[var(--nm-accent-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--nm-text-dimmed)] font-[family-name:var(--font-data)] text-xs tracking-widest uppercase">
            Verificando acesso...
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <Outlet />
}
