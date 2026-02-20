import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'

interface LoginFormData {
  email: string
  password: string
}

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const from = (location.state as { from?: string })?.from ?? '/dashboard'

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>()

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setServerError(null)

    const { error } = await signIn(data.email, data.password)

    if (error) {
      setServerError('Email ou senha incorretos. Tente novamente.')
      setIsLoading(false)
      return
    }

    navigate(from, { replace: true })
  }

  return (
    <div className="min-h-screen bg-[var(--nm-bg-main)] flex items-center justify-center px-4 py-12">
      {/* Blueprint grid overlay */}
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
        {/* Logo */}
        <Link
          to="/"
          className="block text-center mb-10 text-[var(--nm-text-high)] font-[family-name:var(--font-data)] text-2xl tracking-[0.25em] hover:text-[var(--nm-accent-primary)] transition-colors"
        >
          NUMETRIA
        </Link>

        {/* Card */}
        <div className="bg-[var(--nm-bg-surface)] border border-[var(--nm-grid-line)] rounded-[var(--radius-technical)] p-8">
          {/* Header */}
          <div className="mb-7">
            <p className="text-[var(--nm-text-dimmed)] text-[10px] font-[family-name:var(--font-data)] tracking-[0.2em] uppercase mb-1.5">
              AUTH / LOGIN
            </p>
            <h1 className="text-[var(--nm-text-high)] text-xl font-semibold">
              Entrar na conta
            </h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                  'w-full px-4 py-3',
                  'bg-[var(--nm-bg-main)]',
                  'border rounded-[var(--radius-technical)]',
                  errors.email ? 'border-red-500/70' : 'border-[var(--nm-grid-line)]',
                  'text-[var(--nm-text-high)] text-sm',
                  'placeholder:text-[var(--nm-text-dimmed)]/30',
                  'focus:outline-none focus:border-[var(--nm-accent-primary)]',
                  'transition-colors',
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
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="text-[10px] text-[var(--nm-text-dimmed)] font-[family-name:var(--font-data)] tracking-[0.15em] uppercase"
                >
                  Senha
                </label>
                <Link
                  to="/recuperar-senha"
                  className="text-xs text-[var(--nm-accent-primary)] hover:underline"
                >
                  Esqueceu?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className={[
                  'w-full px-4 py-3',
                  'bg-[var(--nm-bg-main)]',
                  'border rounded-[var(--radius-technical)]',
                  errors.password ? 'border-red-500/70' : 'border-[var(--nm-grid-line)]',
                  'text-[var(--nm-text-high)] text-sm',
                  'placeholder:text-[var(--nm-text-dimmed)]/30',
                  'focus:outline-none focus:border-[var(--nm-accent-primary)]',
                  'transition-colors',
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

            {/* Erro do servidor */}
            {serverError && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-technical)]">
                <p className="text-xs text-red-400">{serverError}</p>
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-1 bg-[var(--nm-accent-primary)] hover:bg-[#4A82FF] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-[var(--radius-technical)] transition-colors"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Rodapé */}
          <div className="mt-6 pt-6 border-t border-[var(--nm-grid-line)] text-center">
            <p className="text-xs text-[var(--nm-text-dimmed)]">
              Não tem conta?{' '}
              <Link to="/signup" className="text-[var(--nm-accent-primary)] hover:underline">
                Criar conta
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
