import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

type Payload = {
  action?: 'check_access' | 'create_checkout'
  concept_id?: number
  price_id?: 'monthly' | 'annual'
}

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

    const payload = (await req.json().catch(() => ({}))) as Payload
    const action = payload.action ?? 'check_access'

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('plan_type, plan_expires_at')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return jsonResponse({ error: 'Profile not found' }, 404)
    }

    const planType = profile.plan_type as 'free' | 'pro'
    const expiresAt = profile.plan_expires_at ? new Date(profile.plan_expires_at) : null
    const isPro = planType === 'pro' && (!expiresAt || expiresAt.getTime() > Date.now())

    if (action === 'create_checkout') {
      const checkoutUrl = await createCheckoutUrl({
        userId: user.id,
        email: user.email ?? '',
        priceId: payload.price_id ?? 'annual',
      })

      return jsonResponse({
        plan_type: planType,
        is_active: isPro,
        checkout_url: checkoutUrl,
        message: checkoutUrl
          ? 'Checkout criado com sucesso'
          : 'Stripe nao configurado. Fluxo de upgrade em modo stub.',
      })
    }

    const conceptId = payload.concept_id ?? 1
    const canAccess = conceptId <= 15 || isPro

    return jsonResponse({
      plan_type: planType,
      plan_expires_at: profile.plan_expires_at,
      is_active: isPro,
      concept_id: conceptId,
      can_access: canAccess,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return jsonResponse({ error: message }, 500)
  }
})

async function createCheckoutUrl(params: {
  userId: string
  email: string
  priceId: 'monthly' | 'annual'
}): Promise<string | null> {
  const secret = Deno.env.get('STRIPE_SECRET_KEY')
  const monthly = Deno.env.get('STRIPE_PRICE_MONTHLY')
  const annual = Deno.env.get('STRIPE_PRICE_ANNUAL')
  const successUrl = Deno.env.get('APP_SUCCESS_URL')
  const cancelUrl = Deno.env.get('APP_CANCEL_URL')

  if (!secret || !monthly || !annual || !successUrl || !cancelUrl) {
    return null
  }

  const selectedPriceId = params.priceId === 'monthly' ? monthly : annual

  const body = new URLSearchParams()
  body.append('mode', 'subscription')
  body.append('success_url', successUrl)
  body.append('cancel_url', cancelUrl)
  body.append('line_items[0][price]', selectedPriceId)
  body.append('line_items[0][quantity]', '1')
  body.append('metadata[user_id]', params.userId)
  if (params.email) body.append('customer_email', params.email)

  const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!stripeRes.ok) {
    const errorText = await stripeRes.text()
    throw new Error(`Stripe checkout error: ${errorText}`)
  }

  const data = (await stripeRes.json()) as { url?: string }
  return data.url ?? null
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
