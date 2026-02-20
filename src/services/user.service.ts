import { supabase } from '../lib/supabase'
import { Profile, ConceptProgress } from '../types/database'

export const userService = {
  async getProfile(): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async getConceptProgress(): Promise<ConceptProgress[]> {
    const { data, error } = await supabase
      .from('concept_progress')
      .select('*')
      .order('concept_id')

    if (error) throw new Error(error.message)
    return data ?? []
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
