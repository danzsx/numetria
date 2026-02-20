import { useState, useEffect, useCallback } from 'react'
import { ConceptProgress } from '../types/database'
import { userService } from '../services/user.service'
import { useAuth } from '../contexts/AuthContext'

export function useConceptProgress() {
  const { user } = useAuth()
  const [progress, setProgress] = useState<ConceptProgress[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProgress = useCallback(async () => {
    if (!user) {
      setProgress([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await userService.getConceptProgress()
      setProgress(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar progresso')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  // Retorna progresso de um conceito específico
  const getConceptById = useCallback(
    (conceptId: number) => progress.find((cp) => cp.concept_id === conceptId) ?? null,
    [progress]
  )

  // Calcula progresso percentual de um range de conceitos (ex: módulo foundational = 1-8)
  const getModuleProgress = useCallback(
    (fromId: number, toId: number): number => {
      const total = toId - fromId + 1
      const completed = progress.filter(
        (cp) =>
          cp.concept_id >= fromId &&
          cp.concept_id <= toId &&
          (cp.status === 'completed' || cp.status === 'mastered')
      ).length
      return total > 0 ? Math.round((completed / total) * 100) : 0
    },
    [progress]
  )

  return { progress, loading, error, refetch: fetchProgress, getConceptById, getModuleProgress }
}
