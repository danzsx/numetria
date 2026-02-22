import { supabase } from '../lib/supabase'
import { Profile, ConceptProgress } from '../types/database'

export interface PlanStatus {
  plan_type: 'free' | 'pro'
  plan_expires_at: string | null
  is_active: boolean
  /** 'admin' tem acesso Pro completo sem depender do Stripe */
  role: 'user' | 'admin'
  is_admin: boolean
}

export const userService = {
  async getProfile(): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async getPlanStatus(): Promise<PlanStatus> {
    const { data, error } = await supabase.rpc('get_plan_access')
    if (!error && data) {
      const result = data as PlanStatus
      return {
        plan_type: result.plan_type ?? 'free',
        plan_expires_at: result.plan_expires_at ?? null,
        is_active: Boolean(result.is_active),
        role: result.role ?? 'user',
        is_admin: Boolean(result.is_admin),
      }
    }

    // Fallback: lê perfil diretamente se o RPC falhar
    const profile = await this.getProfile()
    const fallbackPlanType = profile?.plan_type ?? 'free'
    const fallbackRole = profile?.role ?? 'user'
    const fallbackExpiresAt = profile?.plan_expires_at ?? null
    const fallbackIsAdmin = fallbackRole === 'admin'
    const fallbackIsActive =
      fallbackIsAdmin ||
      (fallbackPlanType === 'pro' && (!fallbackExpiresAt || new Date(fallbackExpiresAt).getTime() > Date.now()))

    return {
      plan_type: fallbackPlanType,
      plan_expires_at: fallbackExpiresAt,
      is_active: fallbackIsActive,
      role: fallbackRole,
      is_admin: fallbackIsAdmin,
    }
  },

  async getConceptProgress(): Promise<ConceptProgress[]> {
    const { data, error } = await supabase
      .from('concept_progress')
      .select('*')
      .order('concept_id')

    if (error) throw new Error(error.message)
    return data ?? []
  },

  async createCheckoutSession(priceId: 'monthly' | 'annual'): Promise<{ checkout_url: string | null; message: string }> {
    const { data, error } = await supabase.functions.invoke('check-plan-access', {
      body: { action: 'create_checkout', price_id: priceId },
    })

    if (error) throw new Error(error.message)

    const result = data as { checkout_url?: string; message?: string } | null
    return {
      checkout_url: result?.checkout_url ?? null,
      message: result?.message ?? 'Upgrade iniciado',
    }
  },

  async cancelSubscription(): Promise<{ message: string }> {
    const { data, error } = await supabase.rpc('cancel_my_pro_subscription')
    if (error) throw new Error(error.message)

    const result = data as { message?: string } | null
    return { message: result?.message ?? 'Plano cancelado com sucesso' }
  },

  async updateProfile(updates: Partial<Pick<Profile, 'display_name' | 'preferred_session_length' | 'onboarding_completed'>>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },
}
