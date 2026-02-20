import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'

interface SignupFormData {
  displayName: string
  email: string
  password: string
  confirmPassword: string
}

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignupFormData>()
  const password = watch('password')

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    setServerError(null)

    const { error } = await signUp(data.email, data.password, data.displayName)

    if (error) {
      setServerError(error)
      setIsLoading(false)
      return
    }

    // Supabase pode exigir confirmação por email — mostra mensagem
    setEmailSent(true)
    setIsLoading(false)

    // Se confirmação de email estiver desativada no Supabase, redireciona
    setTimeout(() => navigate('/dashboard', { replace: true }), 2000)
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-[var(--nm-bg-main)] flex items-center justify-center px-4">
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(var(--nm-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--nm-grid-line) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: 0.35,
          }}
        />
        <div className="relative w-full max-w-sm bg-[var(--nm-bg-surface)] border border-[var(--nm-grid-line)] rounded-[var(--radius-technical)] p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--nm-accent-primary)]/10 border border-[var(--nm-accent-primary)]/30 flex items-center justify-center mx-auto mb-5">
            <span className="text-[var(--nm-accent-primary)] text-lg">✓</span>
          </div>
          <h2 className="text-[var(--nm-text-high)] text-lg font-semibold mb-2">
            Conta criada!
          </h2>
          <p className="text-sm text-[var(--nm-text-dimmed)]">
            Verifique seu email para confirmar o cadastro. Redirecionando...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--nm-bg-main)] flex items-center justify-center px-4 py-12">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(var(--nm-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--nm-grid-line) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.35,
        }}
      />

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
              AUTH / REGISTRO
            </p>
            <h1 className="text-[var(--nm-text-high)] text-xl font-semibold">
              Criar conta
            </h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Nome */}
            <div>
              <label
                htmlFor="displayName"
                className="block text-[10px] text-[var(--nm-text-dimmed)] font-[family-name:var(--font-data)] tracking-[0.15em] uppercase mb-2"
              >
                Nome
              </label>
              <input
                id="displayName"
                type="text"
                autoComplete="name"
                placeholder="Seu nome"
                className={[
                  'w-full px-4 py-3 bg-[var(--nm-bg-main)] border rounded-[var(--radius-technical)]',
                  errors.displayName ? 'border-red-500/70' : 'border-[var(--nm-grid-line)]',
                  'text-[var(--nm-text-high)] text-sm placeholder:text-[var(--nm-text-dimmed)]/30',
                  'focus:outline-none focus:border-[var(--nm-accent-primary)] transition-colors',
                ].join(' ')}
                {...register('displayName', { required: 'Nome obrigatório' })}
              />
              {errors.displayName && (
                <p className="mt-1.5 text-xs text-red-400">{errors.displayName.message}</p>
              )}
            </div>

            {/* Email */}
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

            {/* Senha */}
            <div>
              <label
                htmlFor="password"
                className="block text-[10px] text-[var(--nm-text-dimmed)] font-[family-name:var(--font-data)] tracking-[0.15em] uppercase mb-2"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                className={[
                  'w-full px-4 py-3 bg-[var(--nm-bg-main)] border rounded-[var(--radius-technical)]',
                  errors.password ? 'border-red-500/70' : 'border-[var(--nm-grid-line)]',
                  'text-[var(--nm-text-high)] text-sm placeholder:text-[var(--nm-text-dimmed)]/30',
                  'focus:outline-none focus:border-[var(--nm-accent-primary)] transition-colors',
                ].join(' ')}
                {...register('password', {
                  required: 'Senha obrigatória',
                  minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                })}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Confirmar senha */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-[10px] text-[var(--nm-text-dimmed)] font-[family-name:var(--font-data)] tracking-[0.15em] uppercase mb-2"
              >
                Confirmar senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Repita a senha"
                className={[
                  'w-full px-4 py-3 bg-[var(--nm-bg-main)] border rounded-[var(--radius-technical)]',
                  errors.confirmPassword ? 'border-red-500/70' : 'border-[var(--nm-grid-line)]',
                  'text-[var(--nm-text-high)] text-sm placeholder:text-[var(--nm-text-dimmed)]/30',
                  'focus:outline-none focus:border-[var(--nm-accent-primary)] transition-colors',
                ].join(' ')}
                {...register('confirmPassword', {
                  required: 'Confirme a senha',
                  validate: (v) => v === password || 'As senhas não coincidem',
                })}
              />
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword.message}</p>
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
              {isLoading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[var(--nm-grid-line)] text-center">
            <p className="text-xs text-[var(--nm-text-dimmed)]">
              Já tem conta?{' '}
              <Link to="/login" className="text-[var(--nm-accent-primary)] hover:underline">
                Entrar
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-5 text-center text-[10px] text-[var(--nm-text-dimmed)]/30 font-[family-name:var(--font-data)] tracking-widest">
          NUMETRIA / AUTH_v1
        </p>
      </div>
    </div>
  )
}
