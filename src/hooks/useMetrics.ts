import { useState, useEffect, useCallback } from 'react'
import { metricsService } from '../services/metrics.service'
import { useAuth } from '../contexts/AuthContext'
import type { DashboardData } from '../types/database'

export function useMetrics() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const data = await metricsService.getDashboardData()
      setDashboardData(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar métricas')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  return {
    dashboardData,
    loading,
    error,
    refetch: fetchDashboard,
  }
}
