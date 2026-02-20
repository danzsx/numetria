import { supabase } from '../lib/supabase'
import type { AdaptiveRecommendation } from '../types/database'

export const adaptiveService = {
  /**
   * Chama a RPC get_adaptive_recommendation e retorna a recomendação
   * de treino para o usuário autenticado.
   *
   * @param conceptId - ID do conceito (null = análise global, sem filtro)
   */
  async getRecommendation(conceptId?: number | null): Promise<AdaptiveRecommendation | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data, error } = await supabase.rpc('get_adaptive_recommendation', {
      p_user_id:    user.id,
      p_concept_id: conceptId ?? null,
    })

    if (error) throw new Error(error.message)
    return data as AdaptiveRecommendation
  },
}
