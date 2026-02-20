import { useState } from 'react'
import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'

interface ForgotPasswordFormData {
  email: string
}

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>()

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    setServerError(null)

    const { error } = await resetPassword(data.email)

    if (error) {
      setServerError('Não foi possível enviar o email. Verifique o endereço informado.')
      setIsLoading(false)
      return
    }

    setEmailSent(true)
    setIsLoading(false)
  }

  const GridOverlay = () => (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        backgroundImage:
          'linear-gradient(var(--nm-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--nm-grid-line) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        opacity: 0.35,
      }}
    />
  )

  if (emailSent) {
    return (
      <div className="min-h-screen bg-[var(--nm-bg-main)] flex items-center justify-center px-4">
        <GridOverlay />
        <div className="relative w-full max-w-sm bg-[var(--nm-bg-surface)] border border-[var(--nm-grid-line)] rounded-[var(--radius-technical)] p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--nm-accent-primary)]/10 border border-[var(--nm-accent-primary)]/30 flex items-center justify-center mx-auto mb-5">
            <span className="text-[var(--nm-accent-primary)] text-lg">✉</span>
          </div>
          <h2 className="text-[var(--nm-text-high)] text-lg font-semibold mb-2">
            Email enviado
          </h2>
          <p className="text-sm text-[var(--nm-text-dimmed)] mb-6">
            Verifique sua caixa de entrada e clique no link para redefinir sua senha.
          </p>
          <Link
            to="/login"
            className="text-sm text-[var(--nm-accent-primary)] hover:underline"
          >
            ← Voltar ao login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--nm-bg-main)] flex items-center justify-center px-4 py-12">
      <GridOverlay />

      <div className="relative w-full max-w-sm">
        <Link
          to="/"
          className="block text-center mb-10 text-[var(--nm-text-high)] font-[family-name:var(--font-data)] text-2xl tracking-[0.25em] hover:text-[var(--nm-accent-primary)] transition-colors"
        >
          NUMETRIA
        </Link>

        <div className="bg-[var(--nm-bg-surface)] border border-[var(--nm-grid-line)] rounded-[var(--radius-technical)] p-8">
          <div className="mb-7">
            <p className="text-[var(--nm-text-dimmed)] text-[10px] font-[family-name:var(--font-data)] tracking-[0.2em] uppercase mb-1.5">
              AUTH / RECUPERAÇÃO
            </p>
            <h1 className="text-[var(--nm-text-high)] text-xl font-semibold">
              Recuperar senha
            </h1>
            <p className="mt-2 text-sm text-[var(--nm-text-dimmed)]">
              Informe seu email e enviaremos um link para redefinir sua senha.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-[10px] text-[var(--nm-text-dimmed)] font-[family-name:var(--font-data)] tracking-[0.15em] uppercase mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                className={[
                  'w-full px-4 py-3 bg-[var(--nm-bg-main)] border rounded-[var(--radius-technical)]',
                  errors.email ? 'border-red-500/70' : 'border-[var(--nm-grid-line)]',
                  'text-[var(--nm-text-high)] text-sm placeholder:text-[var(--nm-text-dimmed)]/30',
                  'focus:outline-none focus:border-[var(--nm-accent-primary)] transition-colors',
                ].join(' ')}
                {...register('email', {
                  required: 'Email obrigatório',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email inválido' },
                })}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {serverError && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-technical)]">
                <p className="text-xs text-red-400">{serverError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-1 bg-[var(--nm-accent-primary)] hover:bg-[#4A82FF] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-[var(--radius-technical)] transition-colors"
            >
              {isLoading ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[var(--nm-grid-line)] text-center">
            <Link to="/login" className="text-xs text-[var(--nm-accent-primary)] hover:underline">
              ← Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
