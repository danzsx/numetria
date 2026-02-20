export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          created_at: string
          updated_at: string
          plan_type: 'free' | 'pro'
          plan_expires_at: string | null
          preferred_session_length: number | null
          onboarding_completed: boolean | null
          global_precision: number | null
          global_avg_time: number | null
          global_variability: number | null
          adaptive_level: number | null
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          created_at?: string
          updated_at?: string
          plan_type?: 'free' | 'pro'
          plan_expires_at?: string | null
          preferred_session_length?: number | null
          onboarding_completed?: boolean | null
          global_precision?: number | null
          global_avg_time?: number | null
          global_variability?: number | null
          adaptive_level?: number | null
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          updated_at?: string
          plan_type?: 'free' | 'pro'
          plan_expires_at?: string | null
          preferred_session_length?: number | null
          onboarding_completed?: boolean | null
          global_precision?: number | null
          global_avg_time?: number | null
          global_variability?: number | null
          adaptive_level?: number | null
        }
      }
      streaks: {
        Row: {
          id: string
          user_id: string
          current_streak_days: number | null
          longest_streak_days: number | null
          last_training_date: string | null
          streak_started_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          current_streak_days?: number | null
          longest_streak_days?: number | null
          last_training_date?: string | null
          streak_started_at?: string | null
          updated_at?: string | null
        }
        Update: {
          current_streak_days?: number | null
          longest_streak_days?: number | null
          last_training_date?: string | null
          streak_started_at?: string | null
          updated_at?: string | null
        }
      }
      plan_subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_type: 'free' | 'pro'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          started_at: string
          expires_at: string | null
          cancelled_at: string | null
          is_active: boolean | null
        }
        Insert: {
          id?: string
          user_id: string
          plan_type: 'free' | 'pro'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          started_at?: string
          expires_at?: string | null
          cancelled_at?: string | null
          is_active?: boolean | null
        }
        Update: {
          plan_type?: 'free' | 'pro'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          expires_at?: string | null
          cancelled_at?: string | null
          is_active?: boolean | null
        }
      }
      training_sessions: {
        Row: {
          id: string
          user_id: string
          operation: 'multiplication' | 'division' | 'addition' | 'subtraction'
          base_number: number
          mode: 'sequential' | 'random'
          timer_mode: 'timed' | 'untimed'
          level: number
          concept_id: number | null
          lesson_number: number | null
          total_problems: number
          correct_answers: number
          total_time_ms: number
          precision_pct: number
          avg_time_ms: number
          time_variability: number
          session_status: 'stable' | 'consolidating' | 'unstable'
          recommendation: string | null
          started_at: string
          completed_at: string
          session_aborted: boolean | null
        }
        Insert: {
          id?: string
          user_id: string
          operation: 'multiplication' | 'division' | 'addition' | 'subtraction'
          base_number: number
          mode: 'sequential' | 'random'
          timer_mode: 'timed' | 'untimed'
          level: number
          concept_id?: number | null
          lesson_number?: number | null
          total_problems: number
          correct_answers: number
          total_time_ms: number
          precision_pct: number
          avg_time_ms: number
          time_variability: number
          session_status: 'stable' | 'consolidating' | 'unstable'
          recommendation?: string | null
          started_at?: string
          completed_at?: string
          session_aborted?: boolean | null
        }
        Update: {
          session_aborted?: boolean | null
        }
      }
      session_problems: {
        Row: {
          id: string
          session_id: string
          user_id: string
          problem_index: number
          operand1: number
          operand2: number
          operation: string
          correct_answer: number
          user_answer: number | null
          is_correct: boolean
          time_ms: number
          answered_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          problem_index: number
          operand1: number
          operand2: number
          operation: string
          correct_answer: number
          user_answer?: number | null
          is_correct: boolean
          time_ms: number
          answered_at?: string
        }
        Update: Record<string, never>
      }
      concept_progress: {
        Row: {
          id: string
          user_id: string
          concept_id: number
          status: 'locked' | 'available' | 'in_progress' | 'completed' | 'mastered'
          lesson_1_status: 'locked' | 'available' | 'completed' | null
          lesson_2_status: 'locked' | 'available' | 'completed' | null
          lesson_3_status: 'locked' | 'available' | 'completed' | null
          total_sessions: number | null
          best_precision: number | null
          last_precision: number | null
          avg_precision: number | null
          first_attempted_at: string | null
          last_attempted_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          concept_id: number
          status?: 'locked' | 'available' | 'in_progress' | 'completed' | 'mastered'
          lesson_1_status?: 'locked' | 'available' | 'completed' | null
          lesson_2_status?: 'locked' | 'available' | 'completed' | null
          lesson_3_status?: 'locked' | 'available' | 'completed' | null
          total_sessions?: number | null
          best_precision?: number | null
          last_precision?: number | null
          avg_precision?: number | null
          first_attempted_at?: string | null
          last_attempted_at?: string | null
          completed_at?: string | null
        }
        Update: {
          status?: 'locked' | 'available' | 'in_progress' | 'completed' | 'mastered'
          lesson_1_status?: 'locked' | 'available' | 'completed' | null
          lesson_2_status?: 'locked' | 'available' | 'completed' | null
          lesson_3_status?: 'locked' | 'available' | 'completed' | null
          total_sessions?: number | null
          best_precision?: number | null
          last_precision?: number | null
          avg_precision?: number | null
          last_attempted_at?: string | null
          completed_at?: string | null
        }
      }
      daily_metrics: {
        Row: {
          id: string
          user_id: string
          date: string
          sessions_count: number
          problems_total: number
          problems_correct: number
          total_time_ms: number
          precision_pct: number | null
          avg_time_ms: number | null
          time_variability: number | null
          stability_score: number | null
          velocity_score: number | null
          precision_score: number | null
          automation_score: number | null
          day_status: 'no_data' | 'unstable' | 'consolidating' | 'stable' | null
          computed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          sessions_count?: number
          problems_total?: number
          problems_correct?: number
          total_time_ms?: number
          precision_pct?: number | null
          avg_time_ms?: number | null
          time_variability?: number | null
          stability_score?: number | null
          velocity_score?: number | null
          precision_score?: number | null
          automation_score?: number | null
          day_status?: 'no_data' | 'unstable' | 'consolidating' | 'stable' | null
          computed_at?: string
        }
        Update: {
          sessions_count?: number
          problems_total?: number
          problems_correct?: number
          total_time_ms?: number
          precision_pct?: number | null
          avg_time_ms?: number | null
          time_variability?: number | null
          stability_score?: number | null
          velocity_score?: number | null
          precision_score?: number | null
          automation_score?: number | null
          day_status?: 'no_data' | 'unstable' | 'consolidating' | 'stable' | null
          computed_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      complete_session: {
        Args: { session_data: Json }
        Returns: Json
      }
      cancel_my_pro_subscription: {
        Args: Record<string, never>
        Returns: Json
      }
      get_plan_access: {
        Args: Record<string, never>
        Returns: Json
      }
      get_user_dashboard: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_adaptive_recommendation: {
        Args: { p_user_id: string; p_concept_id?: number | null }
        Returns: Json
      }
    }
    Enums: Record<string, never>
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Streak = Database['public']['Tables']['streaks']['Row']
export type PlanSubscription = Database['public']['Tables']['plan_subscriptions']['Row']
export type TrainingSession = Database['public']['Tables']['training_sessions']['Row']
export type SessionProblem = Database['public']['Tables']['session_problems']['Row']
export type ConceptProgress = Database['public']['Tables']['concept_progress']['Row']
export type DailyMetric = Database['public']['Tables']['daily_metrics']['Row']

export interface DashboardData {
  profile: Profile | null
  streak: Streak | null
  last_30_days: DailyMetric[]
  concept_summary: ConceptProgress[]
  recent_sessions: TrainingSession[]
}

export interface AdaptiveRecommendation {
  level: 1 | 2 | 3 | 4
  mode: 'sequential' | 'random'
  timer_mode: 'timed' | 'untimed'
  reason: string
  session_count: number
  avg_precision: number
  stable_count: number
  unstable_count: number
  last_status: 'stable' | 'consolidating' | 'unstable'
  previous_concept_id: number | null
}
