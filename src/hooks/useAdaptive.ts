import { useState, useEffect, useCallback } from 'react'
import { adaptiveService } from '../services/adaptive.service'
import { useAuth } from '../contexts/AuthContext'
import type { AdaptiveRecommendation } from '../types/database'

/**
 * Busca a recomendação adaptativa do motor pedagógico.
 *
 * @param conceptId - Filtrar análise por conceito específico (null = global)
 *
 * Retorna graciosamente se o usuário não estiver autenticado (modo local).
 */
export function useAdaptive(conceptId?: number | null) {
  const { user } = useAuth()
  const [recommendation, setRecommendation] = useState<AdaptiveRecommendation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRecommendation = useCallback(async () => {
    if (!user) {
      setRecommendation(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await adaptiveService.getRecommendation(conceptId)
      setRecommendation(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar recomendação')
    } finally {
      setLoading(false)
    }
  }, [user, conceptId])

  useEffect(() => {
    fetchRecommendation()
  }, [fetchRecommendation])

  return { recommendation, loading, error, refetch: fetchRecommendation }
}
