import { supabase } from '../lib/supabase'
import type { Session, User, AuthError } from '@supabase/supabase-js'

export interface AuthResult {
  user: User | null
  session: Session | null
  error: AuthError | null
}

export const authService = {
  async signUp(email: string, password: string, displayName?: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName ?? '' },
      },
    })
    return { user: data.user, session: data.session, error }
  },

  async signIn(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { user: data.user, session: data.session, error }
  },

  async signOut(): Promise<{ error: AuthError | null }> {
    return supabase.auth.signOut()
  },

  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/recuperar-senha`,
    })
    return { error }
  },

  async getSession(): Promise<Session | null> {
    const { data } = await supabase.auth.getSession()
    return data.session
  },

  async getUser(): Promise<User | null> {
    const { data } = await supabase.auth.getUser()
    return data.user
  },
}
