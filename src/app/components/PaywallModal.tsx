import { useNavigate } from 'react-router'
import * as Dialog from '@radix-ui/react-dialog'
import { Lock, X } from 'lucide-react'

interface PaywallModalProps {
  open: boolean
  onClose: () => void
  moduleName: string
}

export function PaywallModal({ open, onClose, moduleName }: PaywallModalProps) {
  const navigate = useNavigate()

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />
        <Dialog.Content
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-[var(--radius-technical)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200 mx-4"
          style={{
            background: 'var(--nm-bg-surface)',
            border: '1px solid rgba(58, 114, 248, 0.4)',
          }}
        >
          {/* Close button */}
          <Dialog.Close asChild>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-[var(--nm-text-annotation)] hover:text-[var(--nm-text-high)] transition-colors"
            >
              <X size={16} />
              <span className="sr-only">Fechar</span>
            </button>
          </Dialog.Close>

          <div className="p-6">
            {/* Label */}
            <div className="flex items-center gap-2 mb-5">
              <Lock size={12} style={{ color: '#3A72F8' }} />
              <span
                className="font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em]"
                style={{ color: '#3A72F8' }}
              >
                ACESSO_RESTRITO
              </span>
            </div>

            {/* Title */}
            <Dialog.Title className="text-[var(--nm-text-high)] text-xl font-semibold mb-3">
              Requer Protocolo Pro
            </Dialog.Title>

            {/* Description */}
            <Dialog.Description className="text-[var(--nm-text-dimmed)] text-sm leading-relaxed mb-6">
              O módulo{' '}
              <span className="text-[var(--nm-text-high)]">{moduleName}</span>{' '}
              faz parte da Evolução Estrutural Avançada. Desbloqueie análise cognitiva profunda,
              cronômetro adaptativo e mecânicas de interferência controlada.
            </Dialog.Description>

            {/* Divider */}
            <div className="h-px bg-[var(--nm-grid-line)] mb-5" />

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { onClose(); navigate('/pro') }}
                className="w-full py-3 px-4 text-sm font-medium rounded-[var(--radius-technical)] transition-colors bg-[#3A72F8] hover:bg-[#2d5ed4] text-white"
              >
                Conhecer o Protocolo Pro
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 px-4 text-sm text-[var(--nm-text-dimmed)] hover:text-[var(--nm-text-high)] transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
