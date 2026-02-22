import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../../contexts/AuthContext'
import { userService } from '../../services/user.service'

export default function ProLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [isPro, setIsPro] = useState(false)

  useEffect(() => {
    let mounted = true

    async function checkPlan() {
      if (!user) {
        setIsPro(false)
        setLoading(false)
        return
      }

      try {
        // getPlanStatus retorna is_active = true para admins e para usuários Pro válidos
        const status = await userService.getPlanStatus()
        if (mounted) {
          setIsPro(status.is_active)
        }
      } catch {
        if (mounted) {
          setIsPro(false)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    checkPlan()

    return () => {
      mounted = false
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--nm-bg-main)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-6 h-6 border-2 border-[var(--nm-accent-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--nm-text-dimmed)] font-[family-name:var(--font-data)] text-xs tracking-widest uppercase">
            Validando plano Pro...
          </p>
        </div>
      </div>
    )
  }

  if (!isPro) {
    return <Navigate to="/pro" state={{ from: location.pathname }} replace />
  }

  return <Outlet />
}
