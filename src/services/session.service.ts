import { supabase } from '../lib/supabase'
import { TabuadaConfig, Problem, SessionMetrics, analyzeFeedback, getLevel } from '../app/utils/tabuadaEngine'

export interface ProblemAttempt {
  problem: Problem
  userAnswer: number | null
  isCorrect: boolean
  timeMs: number
}

export interface SessionResult {
  session_id: string
  session_status: 'stable' | 'consolidating' | 'unstable'
  recommendation: string | null
  streak: number
  adaptive_level: number
}

export const sessionService = {
  async completeSession(
    config: TabuadaConfig,
    metrics: SessionMetrics,
    analysis: ReturnType<typeof analyzeFeedback>,
    attempts: ProblemAttempt[],
    startedAt: Date,
    conceptId?: number | null
  ): Promise<SessionResult> {
    const payload = {
      operation: config.operation,
      base_number: config.base,
      mode: config.mode,
      timer_mode: config.timerMode,
      level: getLevel(config),
      concept_id: conceptId ?? null,
      lesson_number: null,
      total_problems: metrics.totalProblems,
      correct_answers: metrics.correctAnswers,
      total_time_ms: metrics.totalTime,
      precision_pct: Math.round(metrics.precision * 100) / 100,
      avg_time_ms: Math.round(metrics.avgTime * 1000) / 1000,
      time_variability: Math.round(metrics.timeVariability * 1000) / 1000,
      session_status: analysis.status,
      recommendation: analysis.recommendation ?? null,
      started_at: startedAt.toISOString(),
      problems: attempts.map((attempt, idx) => ({
        problem_index: idx,
        operand1: attempt.problem.operand1,
        operand2: attempt.problem.operand2,
        operation: attempt.problem.operation,
        correct_answer: attempt.problem.correctAnswer,
        user_answer: attempt.userAnswer,
        is_correct: attempt.isCorrect,
        time_ms: attempt.timeMs,
      })),
    }

    const { data, error } = await supabase.rpc('complete_session', { session_data: payload })

    if (error) throw new Error(error.message)

    return data as SessionResult
  },
}
