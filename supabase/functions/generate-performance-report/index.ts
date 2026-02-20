import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const authHeader = req.headers.get('Authorization')

    if (!supabaseUrl || !anonKey || !serviceRoleKey || !authHeader) {
      return jsonResponse({ error: 'Missing configuration or auth header' }, 401)
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const { data: planData, error: planError } = await userClient.rpc('get_plan_access')
    if (planError) {
      return jsonResponse({ error: planError.message }, 400)
    }

    const isPro = Boolean((planData as { is_active?: boolean } | null)?.is_active)
    if (!isPro) {
      return jsonResponse({ error: 'Acesso restrito ao plano Pro' }, 403)
    }

    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - 6)

    const isoStart = startDate.toISOString().slice(0, 10)
    const isoEnd = today.toISOString().slice(0, 10)

    const { data: metrics, error: metricsError } = await adminClient
      .from('daily_metrics')
      .select('date, precision_score, velocity_score, stability_score, automation_score, sessions_count')
      .eq('user_id', user.id)
      .gte('date', isoStart)
      .lte('date', isoEnd)
      .order('date', { ascending: true })

    if (metricsError) {
      return jsonResponse({ error: metricsError.message }, 400)
    }

    const sessions = metrics ?? []
    const totals = sessions.reduce(
      (acc, row) => {
        acc.precision += Number(row.precision_score ?? 0)
        acc.velocity += Number(row.velocity_score ?? 0)
        acc.stability += Number(row.stability_score ?? 0)
        acc.automation += Number(row.automation_score ?? 0)
        acc.days += 1
        acc.sessionCount += Number(row.sessions_count ?? 0)
        return acc
      },
      { precision: 0, velocity: 0, stability: 0, automation: 0, days: 0, sessionCount: 0 }
    )

    const avg = (value: number) => (totals.days > 0 ? Number((value / totals.days).toFixed(2)) : 0)

    return jsonResponse({
      period: { start: isoStart, end: isoEnd },
      summary: {
        days_with_data: totals.days,
        total_sessions: totals.sessionCount,
        precision_score: avg(totals.precision),
        velocity_score: avg(totals.velocity),
        stability_score: avg(totals.stability),
        automation_score: avg(totals.automation),
      },
      daily_breakdown: sessions,
      generated_at: new Date().toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return jsonResponse({ error: message }, 500)
  }
})

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
