import { useEffect, useState } from 'react'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { MobileNav } from '../components/MobileNav'
import { BlueprintCard } from '../components/BlueprintCard'
import { ActionButton } from '../components/ActionButton'
import { CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { userService, type PlanStatus } from '../../services/user.service'

export default function Pro() {
  const { user } = useAuth()
  const [planStatus, setPlanStatus] = useState<PlanStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const features = [
    'Acesso completo aos modulos Automacao, Ritmo e Precisao',
    'Metricas avancadas de variacao cognitiva',
    'Analise de padrao e distribuicao de erro',
    'Historico ilimitado com visualizacao comparativa',
    'Exportacao de dados para analise externa',
    'Personalizacao de intervalos e ritmo de treino',
    'Suporte tecnico prioritario',
  ]

  useEffect(() => {
    if (!user) {
      setPlanStatus(null)
      return
    }

    let mounted = true

    async function loadPlanStatus() {
      setStatusLoading(true)
      setError(null)
      try {
        const status = await userService.getPlanStatus()
        if (mounted) setPlanStatus(status)
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Nao foi possivel carregar o plano')
        }
      } finally {
        if (mounted) setStatusLoading(false)
      }
    }

    loadPlanStatus()

    return () => {
      mounted = false
    }
  }, [user])

  const handleUpgrade = async (priceId: 'monthly' | 'annual') => {
    if (!user) {
      setError('Faca login para realizar upgrade para o Pro')
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const result = await userService.createCheckoutSession(priceId)
      setMessage(result.message)
      if (result.checkout_url) {
        window.location.assign(result.checkout_url)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel iniciar o checkout')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const result = await userService.cancelSubscription()
      setMessage(result.message)
      const status = await userService.getPlanStatus()
      setPlanStatus(status)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao cancelar plano')
    } finally {
      setLoading(false)
    }
  }

  const isPro = planStatus?.is_active ?? false
  const isAdmin = planStatus?.is_admin ?? false

  return (
    <div className="min-h-screen">
      <Header isLoggedIn={Boolean(user)} />

      <main className="pt-24 pb-16 px-6 mb-16 md:mb-0">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 text-center">
            <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-4">
              PROTOCOL_PRO
            </div>
            <h1 className="text-4xl font-semibold text-[var(--nm-text-high)] mb-4">
              Protocolo completo de treino cognitivo
            </h1>
            <p className="text-lg text-[var(--nm-text-dimmed)] max-w-2xl mx-auto">
              Acesso irrestrito ao sistema proprietario de progressao tecnica.
              Mensuracao avancada, analise de padrao cognitivo e historico completo.
            </p>
          </div>

          {(message || error) && (
            <div className="mb-6">
              <BlueprintCard label={error ? 'ERRO' : 'STATUS'}>
                <p className={error ? 'text-[var(--nm-accent-error)]' : 'text-[var(--nm-accent-stability)]'}>
                  {error ?? message}
                </p>
              </BlueprintCard>
            </div>
          )}

          {(statusLoading || planStatus) && (
            <div className="mb-6">
              <BlueprintCard label="PLANO_ATUAL">
                {statusLoading ? (
                  <p className="text-[var(--nm-text-dimmed)]">Verificando status do plano...</p>
                ) : isAdmin ? (
                  <div className="space-y-1">
                    <p className="text-[var(--nm-accent-primary)] font-[family-name:var(--font-data)] text-xs tracking-widest uppercase">
                      ADMIN_OVERRIDE · Acesso total ativo
                    </p>
                    <p className="text-[var(--nm-text-dimmed)] text-sm">
                      Todas as features Pro estão liberadas via override de desenvolvimento.
                      Stripe não é necessário neste modo.
                    </p>
                  </div>
                ) : isPro ? (
                  <p className="text-[var(--nm-text-dimmed)]">Voce esta com plano Pro ativo.</p>
                ) : (
                  <p className="text-[var(--nm-text-dimmed)]">Voce esta no plano Free.</p>
                )}
              </BlueprintCard>
            </div>
          )}

          <section className="mb-12">
            <BlueprintCard label="FEATURES">
              <div className="space-y-4">
                {features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="text-[var(--nm-accent-primary)] flex-shrink-0 mt-0.5" />
                    <span className="text-[var(--nm-text-high)]">{feature}</span>
                  </div>
                ))}
              </div>
            </BlueprintCard>
          </section>

          <section className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BlueprintCard label="MONTHLY">
                <div className="text-center py-6">
                  <div className="text-4xl font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums mb-2">
                    R$ 49
                  </div>
                  <div className="text-sm text-[var(--nm-text-dimmed)] mb-6">por mes</div>
                  <ActionButton
                    variant="ghost"
                    className="w-full"
                    onClick={() => handleUpgrade('monthly')}
                    disabled={loading}
                  >
                    {loading ? 'Processando...' : 'Selecionar mensal'}
                  </ActionButton>
                </div>
              </BlueprintCard>

              <BlueprintCard label="ANNUAL">
                <div className="text-center py-6">
                  <div className="text-4xl font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums mb-2">
                    R$ 490
                  </div>
                  <div className="text-sm text-[var(--nm-text-dimmed)] mb-2">por ano</div>
                  <div className="text-xs text-[var(--nm-accent-stability)] font-[family-name:var(--font-data)] mb-6">
                    2 MESES_GRATIS
                  </div>
                  <ActionButton
                    variant="primary"
                    className="w-full"
                    onClick={() => handleUpgrade('annual')}
                    disabled={loading}
                  >
                    {loading ? 'Processando...' : 'Selecionar anual'}
                  </ActionButton>
                </div>
              </BlueprintCard>
            </div>
          </section>

          <section>
            <BlueprintCard label="TECHNICAL_INFO">
              <h3 className="text-lg font-semibold text-[var(--nm-text-high)] mb-4">Detalhes tecnicos</h3>

              <div className="space-y-4 text-sm text-[var(--nm-text-dimmed)]">
                <p>
                  O Protocolo Pro desbloqueia modulos avancados de treino estruturado:
                  Automacao (compressao de processos), Ritmo (incremento de velocidade)
                  e Precisao (reducao de variacao).
                </p>

                <p>
                  Metricas avancadas incluem analise de distribuicao de erro,
                  indice de estabilidade neural e variacao temporal.
                  Historico completo permite visualizacao longitudinal da progressao.
                </p>

                <p>
                  Pagamento seguro processado via Stripe.
                  Cancelamento a qualquer momento sem complicacao.
                  Dados permanecem privados e nao sao compartilhados.
                </p>
              </div>
            </BlueprintCard>
          </section>

          <div className="text-center mt-12 pt-12 border-t border-[var(--nm-grid-line)]">
            {isAdmin ? (
              <p className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-xs tracking-widest uppercase">
                MODO_DESENVOLVIMENTO · Admin override ativo
              </p>
            ) : isPro ? (
              <>
                <p className="text-[var(--nm-text-dimmed)] mb-6">Seu plano Pro esta ativo.</p>
                <ActionButton variant="ghost" onClick={handleCancel} disabled={loading}>
                  {loading ? 'Processando...' : 'Cancelar plano Pro'}
                </ActionButton>
              </>
            ) : (
              <>
                <p className="text-[var(--nm-text-dimmed)] mb-6">
                  Comece a construir confianca cognitiva mensuravel hoje.
                </p>
                <ActionButton variant="primary" onClick={() => handleUpgrade('annual')} disabled={loading}>
                  {loading ? 'Processando...' : 'Acesse o protocolo completo'}
                </ActionButton>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  )
}
