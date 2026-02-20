import { supabase } from '../lib/supabase'
import type { DashboardData, DailyMetric, TrainingSession } from '../types/database'

export const metricsService = {
  async getDashboardData(): Promise<DashboardData> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase.rpc('get_user_dashboard', { p_user_id: user.id })
    if (error) throw new Error(error.message)

    return data as DashboardData
  },

  async getLast30Days(): Promise<DailyMetric[]> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('daily_metrics')
      .select('*')
      .gte('date', dateStr)
      .order('date', { ascending: true })

    if (error) throw new Error(error.message)
    return (data ?? []) as DailyMetric[]
  },

  async getRecentSessions(limit = 10): Promise<TrainingSession[]> {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('*')
      .order('completed_at', { ascending: false })
      .limit(limit)

    if (error) throw new Error(error.message)
    return (data ?? []) as TrainingSession[]
  },
}
