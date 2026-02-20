import { ErrorType } from '../../../types/lesson'

interface StructuralFeedbackCardProps {
  errorType: ErrorType
  correctAnswer: number
  userAnswer: number
}

const ERROR_MESSAGES: Record<ErrorType, string> = {
  decomposition: 'Erro na decomposição inicial. A técnica começa por fragmentar o operando corretamente.',
  transport:     'Erro de transporte. Verifique a casa decimal na operação.',
  compensation:  'Erro de compensação. O ajuste final estava incorreto.',
  rhythm:        'Erro de ritmo. A execução foi inconsistente com a técnica.',
}

export function StructuralFeedbackCard({ errorType, correctAnswer, userAnswer }: StructuralFeedbackCardProps) {
  return (
    <div className="p-4 rounded-[var(--radius-technical)] border border-[var(--nm-accent-error)] bg-[var(--nm-bg-main)]">
      <div className="text-[10px] font-[family-name:var(--font-data)] uppercase tracking-[0.12em] text-[var(--nm-accent-error)] mb-2">
        ERRO_ESTRUTURAL
      </div>
      <p className="text-xs text-[var(--nm-text-dimmed)] leading-relaxed mb-3">
        {ERROR_MESSAGES[errorType]}
      </p>
      <div className="flex items-center gap-3 text-xs font-[family-name:var(--font-data)] tabular-nums">
        <span className="text-[var(--nm-accent-error)]">Sua: {userAnswer}</span>
        <span className="text-[var(--nm-text-annotation)]">//</span>
        <span className="text-[var(--nm-accent-stability)]">Correto: {correctAnswer}</span>
      </div>
    </div>
  )
}
