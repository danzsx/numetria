import { useState, useRef, useCallback } from 'react'
import {
  TabuadaConfig,
  Problem,
  SessionMetrics,
  calculateMetrics,
  analyzeFeedback,
} from '../app/utils/tabuadaEngine'
import { sessionService, ProblemAttempt, SessionResult } from '../services/session.service'
import { useAuth } from '../contexts/AuthContext'

export type { ProblemAttempt }

export interface FinishSessionResult {
  metrics: SessionMetrics
  analysis: {
    status: 'stable' | 'consolidating' | 'unstable'
    message: string
    recommendation?: string
  }
  result: SessionResult | null
}

export function useSession() {
  const { user } = useAuth()

  // Refs para dados mutáveis — evita problemas de closures obsoletas
  const startedAtRef = useRef<Date>(new Date())
  const attemptsRef = useRef<ProblemAttempt[]>([])
  const configRef = useRef<TabuadaConfig | null>(null)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const startSession = useCallback((config: TabuadaConfig) => {
    startedAtRef.current = new Date()
    attemptsRef.current = []
    configRef.current = config
    setSaveError(null)
  }, [])

  const recordAttempt = useCallback((attempt: ProblemAttempt) => {
    attemptsRef.current.push(attempt)
  }, [])

  const finishSession = useCallback(
    async (
      correctCount: number,
      totalProblems: number,
      times: number[]
    ): Promise<FinishSessionResult> => {
      const config = configRef.current
      if (!config) throw new Error('Nenhuma sessão ativa.')

      const metrics = calculateMetrics(correctCount, totalProblems, times)
      const analysis = analyzeFeedback(metrics, config)

      // Usuário não autenticado: retorna resultados locais sem salvar
      if (!user) {
        return { metrics, analysis, result: null }
      }

      setSaving(true)
      try {
        const result = await sessionService.completeSession(
          config,
          metrics,
          analysis,
          attemptsRef.current,
          startedAtRef.current
        )
        return { metrics, analysis, result }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido'
        setSaveError(`Sessão não salva: ${message}`)
        // Retorna dados locais mesmo com erro no servidor
        return { metrics, analysis, result: null }
      } finally {
        setSaving(false)
      }
    },
    [user]
  )

  return { saving, saveError, startSession, recordAttempt, finishSession }
}
