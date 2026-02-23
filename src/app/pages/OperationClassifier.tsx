/** ─────────────────────────────────────────────────────────────
 *  Classificador Estrutural de Operações — Página
 *  Spec: docs/spec-classificador-operacoes.md · Fase 3
 *  ───────────────────────────────────────────────────────────── */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { Search, ArrowRight, Sparkles, AlertCircle, Clock, Zap, Lock } from 'lucide-react'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { MobileNav } from '../components/MobileNav'
import { BlueprintCard } from '../components/BlueprintCard'
import { ActionButton } from '../components/ActionButton'
import { PaywallModal } from '../components/PaywallModal'
import { useAuth } from '../../contexts/AuthContext'
import { userService } from '../../services/user.service'
import {
    classifyOperation,
    ClassificationError,
} from '../../services/operationClassifier.service'
import type {
    ClassificationResult,
    ConceptMatch,
    ParseError,
} from '../../types/classifier'

// ─── Page States ───────────────────────────────────────────────────────────────

type PageState = 'empty' | 'input' | 'loading' | 'result' | 'error'

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Operator symbol for display */
const OPERATOR_SYMBOLS: Record<string, string> = {
    addition: '+',
    subtraction: '−',
    multiplication: '×',
    division: '÷',
}

/** Confidence bar color based on value */
function getConfidenceColor(confidence: number): string {
    if (confidence >= 0.85) return 'var(--nm-accent-stability)'
    if (confidence >= 0.60) return 'var(--nm-accent-primary)'
    return '#F59E0B' // amber for low confidence
}

/** Confidence label */
function getConfidenceLabel(confidence: number): string {
    if (confidence >= 0.90) return 'Muito Alta'
    if (confidence >= 0.75) return 'Alta'
    if (confidence >= 0.60) return 'Moderada'
    return 'Baixa'
}

/** Match layer label */
function getLayerLabel(layer: string): string {
    switch (layer) {
        case 'direct': return 'Match Direto'
        case 'decomposition': return 'Decomposição'
        case 'heuristic': return 'Heurística'
        default: return layer
    }
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function OperationClassifier() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const inputRef = useRef<HTMLInputElement>(null)

    // ─── State ─────────────────────────────────────────────────────────────────
    const [inputValue, setInputValue] = useState('')
    const [pageState, setPageState] = useState<PageState>('empty')
    const [result, setResult] = useState<ClassificationResult | null>(null)
    const [error, setError] = useState<ParseError | null>(null)
    const [isPro, setIsPro] = useState(false)
    const [paywallOpen, setPaywallOpen] = useState(false)
    const [paywallModuleName, setPaywallModuleName] = useState('')

    // ─── Effects ───────────────────────────────────────────────────────────────

    // Check Pro status
    useEffect(() => {
        userService.getPlanStatus().then(s => setIsPro(s.is_active)).catch(() => { })
    }, [])

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    // ─── Handlers ──────────────────────────────────────────────────────────────

    const handleClassify = useCallback(() => {
        const trimmed = inputValue.trim()
        if (!trimmed) return

        setPageState('loading')
        setResult(null)
        setError(null)

        // Artificial 250ms minimum for loading feel (spec §3.1: 250ms cap)
        const startTime = Date.now()

        try {
            const classificationResult = classifyOperation(trimmed)

            const elapsed = Date.now() - startTime
            const delay = Math.max(0, 250 - elapsed)

            setTimeout(() => {
                setResult(classificationResult)
                setPageState('result')
            }, delay)
        } catch (err) {
            const elapsed = Date.now() - startTime
            const delay = Math.max(0, 250 - elapsed)

            if (err instanceof ClassificationError) {
                setTimeout(() => {
                    setError(err.parseError)
                    setPageState('error')
                }, delay)
            } else {
                setTimeout(() => {
                    setError({
                        type: 'invalid_format',
                        message: 'Erro inesperado ao classificar a operação.',
                    })
                    setPageState('error')
                }, delay)
            }
        }
    }, [inputValue])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value)
        if (pageState === 'empty' || pageState === 'result' || pageState === 'error') {
            setPageState('input')
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleClassify()
        }
    }

    const handleGoToLesson = (match: ConceptMatch) => {
        if (match.isPro && !isPro) {
            setPaywallModuleName(match.moduleName)
            setPaywallOpen(true)
            return
        }

        if (!match.hasLesson) return

        const lessonNumber = result?.recommendedLesson?.lessonNumber ?? 1
        navigate(`/lesson/${match.conceptId}/${lessonNumber}`)
    }

    const handleReset = () => {
        setInputValue('')
        setResult(null)
        setError(null)
        setPageState('empty')
        inputRef.current?.focus()
    }

    // ─── Render ────────────────────────────────────────────────────────────────

    const topMatch = result?.matches[0] ?? null
    const secondaryMatches = result?.matches.slice(1) ?? []

    return (
        <div className="min-h-screen">
            <Header />

            <main className="pt-24 pb-16 px-4 md:px-6 mb-16 md:mb-0">
                <div className="max-w-[720px] mx-auto">

                    {/* ─── Page Title ─────────────────────────────────────── */}
                    <div className="mb-8 text-center">
                        <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-3">
                            CLASSIFIER // ANÁLISE_ESTRUTURAL
                        </div>
                        <h1 className="text-2xl md:text-3xl font-semibold text-[var(--nm-text-high)] mb-2">
                            Classificador de Operações
                        </h1>
                        <p className="text-sm text-[var(--nm-text-dimmed)]">
                            Analise a estrutura cognitiva de qualquer operação matemática
                        </p>
                    </div>

                    {/* ─── Input Section ──────────────────────────────────── */}
                    <div className="mb-8">
                        <BlueprintCard label="OPERAÇÃO" annotation="INPUT">
                            <div className="flex items-center gap-3">
                                <div className="flex-1 relative">
                                    <input
                                        ref={inputRef}
                                        id="classifier-input"
                                        type="text"
                                        value={inputValue}
                                        onChange={handleInputChange}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ex: 2405 × 13"
                                        autoComplete="off"
                                        className={`
                      w-full bg-transparent
                      text-[var(--nm-text-high)] font-[family-name:var(--font-data)]
                      text-lg md:text-xl
                      border-0 border-b-2 
                      ${pageState === 'error'
                                                ? 'border-b-[var(--nm-accent-error)]'
                                                : 'border-b-[var(--nm-grid-line)] focus:border-b-[var(--nm-accent-primary)]'
                                            }
                      outline-none py-3 pr-10
                      transition-colors duration-250
                      placeholder:text-[var(--nm-text-annotation)]
                    `}
                                    />
                                    <Search
                                        size={18}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--nm-text-annotation)]"
                                    />
                                </div>
                                <ActionButton
                                    id="classify-button"
                                    variant="primary"
                                    onClick={handleClassify}
                                    disabled={!inputValue.trim() || pageState === 'loading'}
                                    className="whitespace-nowrap"
                                >
                                    {pageState === 'loading' ? (
                                        <span className="flex items-center gap-2">
                                            <motion.span
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                                className="inline-block"
                                            >
                                                <Zap size={16} />
                                            </motion.span>
                                            Analisando…
                                        </span>
                                    ) : (
                                        'Classificar'
                                    )}
                                </ActionButton>
                            </div>
                        </BlueprintCard>
                    </div>

                    {/* ─── Content Area ───────────────────────────────────── */}
                    <AnimatePresence mode="wait">
                        {/* Empty State */}
                        {pageState === 'empty' && (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.25 }}
                            >
                                <BlueprintCard label="INSTRUÇÃO" annotation="AGUARDANDO">
                                    <div className="text-center py-8">
                                        <div className="flex justify-center mb-4">
                                            <div className="w-12 h-12 rounded-full bg-[var(--nm-accent-primary)]/10 flex items-center justify-center">
                                                <Sparkles size={24} className="text-[var(--nm-accent-primary)]" />
                                            </div>
                                        </div>
                                        <p className="text-[var(--nm-text-dimmed)] text-sm mb-4">
                                            Digite uma operação matemática para analisar sua estrutura cognitiva.
                                        </p>
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {['5 × 14', '48 + 37', '84 ÷ 2', '7 + 8 + 3', '9 × 256'].map((example) => (
                                                <button
                                                    key={example}
                                                    onClick={() => {
                                                        setInputValue(example)
                                                        setPageState('input')
                                                        inputRef.current?.focus()
                                                    }}
                                                    className="px-3 py-1.5 text-xs font-[family-name:var(--font-data)]
                            bg-[var(--nm-bg-main)] border border-[var(--nm-grid-line)]
                            rounded-[var(--radius-technical)] text-[var(--nm-text-dimmed)]
                            hover:border-[var(--nm-accent-primary)] hover:text-[var(--nm-accent-primary)]
                            transition-colors duration-200 cursor-pointer"
                                                >
                                                    {example}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </BlueprintCard>
                            </motion.div>
                        )}

                        {/* Loading State */}
                        {pageState === 'loading' && (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                <BlueprintCard label="PROCESSAMENTO" annotation="LOADING">
                                    <div className="text-center py-8">
                                        <motion.div
                                            animate={{ scale: [1, 1.1, 1] }}
                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                            className="flex justify-center mb-4"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-[var(--nm-accent-primary)]/10 flex items-center justify-center">
                                                <Zap size={24} className="text-[var(--nm-accent-primary)]" />
                                            </div>
                                        </motion.div>
                                        <p className="text-[var(--nm-text-dimmed)] text-sm">
                                            Analisando estrutura cognitiva…
                                        </p>
                                    </div>
                                </BlueprintCard>
                            </motion.div>
                        )}

                        {/* Error State */}
                        {pageState === 'error' && error && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.25 }}
                            >
                                <BlueprintCard label="ERRO" annotation={error.type.toUpperCase()}>
                                    <div className="flex items-start gap-4 py-2">
                                        <div className="mt-0.5">
                                            <AlertCircle size={20} className="text-[#EF4444]" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-[var(--nm-text-high)] font-semibold mb-1">
                                                {error.type === 'empty_input' && 'Entrada Vazia'}
                                                {error.type === 'invalid_format' && 'Formato Inválido'}
                                                {error.type === 'unsupported_operation' && 'Operação Não Suportada'}
                                                {error.type === 'out_of_range' && 'Fora do Intervalo'}
                                            </h3>
                                            <p className="text-sm text-[var(--nm-text-dimmed)] mb-4">
                                                {error.message}
                                            </p>
                                            <button
                                                onClick={handleReset}
                                                className="text-xs text-[var(--nm-accent-primary)] hover:underline cursor-pointer"
                                            >
                                                Tentar novamente
                                            </button>
                                        </div>
                                    </div>
                                </BlueprintCard>
                            </motion.div>
                        )}

                        {/* Result State */}
                        {pageState === 'result' && result && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-4"
                            >
                                {/* ─── Expression Summary ────────────────────────── */}
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <span className="font-[family-name:var(--font-data)] text-[var(--nm-text-annotation)] text-xs">
                                        EXPRESSÃO:
                                    </span>
                                    <span className="font-[family-name:var(--font-data)] text-[var(--nm-text-high)] text-sm">
                                        {result.expression.operands.join(
                                            ` ${OPERATOR_SYMBOLS[result.expression.operator] ?? '?'} `
                                        )}
                                    </span>
                                </div>

                                {/* ─── Primary Match Card ────────────────────────── */}
                                {topMatch && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.3, delay: 0.1 }}
                                    >
                                        <BlueprintCard
                                            label="CONCEITO_MATCH"
                                            annotation={`CONFIDENCE: ${topMatch.confidence.toFixed(2)}`}
                                        >
                                            <div className="space-y-4">
                                                {/* Concept name + Pro badge */}
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <h2 className="text-xl md:text-2xl font-semibold text-[var(--nm-text-high)]">
                                                        {topMatch.conceptName}
                                                    </h2>
                                                    {topMatch.isPro && (
                                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-technical)] text-[10px] font-[family-name:var(--font-data)] uppercase tracking-wider"
                                                            style={{
                                                                background: 'rgba(58, 114, 248, 0.15)',
                                                                color: '#3A72F8',
                                                                border: '1px solid rgba(58, 114, 248, 0.3)',
                                                            }}
                                                        >
                                                            <Lock size={10} />
                                                            PRO
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Module + Lesson info */}
                                                <div className="text-sm text-[var(--nm-text-dimmed)]">
                                                    <span>Módulo {topMatch.moduleName}</span>
                                                    {result.recommendedLesson && (
                                                        <>
                                                            <span className="mx-2">·</span>
                                                            <span>
                                                                Aula {result.recommendedLesson.lessonNumber} — {result.recommendedLesson.lessonName}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Confidence bar */}
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)]">
                                                            CONFIANÇA
                                                        </span>
                                                        <span
                                                            className="font-[family-name:var(--font-data)] font-medium"
                                                            style={{ color: getConfidenceColor(topMatch.confidence) }}
                                                        >
                                                            {(topMatch.confidence * 100).toFixed(0)}% — {getConfidenceLabel(topMatch.confidence)}
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 bg-[var(--nm-bg-main)] rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${topMatch.confidence * 100}%` }}
                                                            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                                                            className="h-full rounded-full"
                                                            style={{ background: getConfidenceColor(topMatch.confidence) }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Reason */}
                                                <div className="p-3 bg-[var(--nm-bg-main)] rounded-[var(--radius-technical)] border border-[var(--nm-grid-line)]">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.1em]">
                                                            {getLayerLabel(topMatch.matchLayer)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-[var(--nm-text-dimmed)] italic">
                                                        "{topMatch.reason}"
                                                    </p>
                                                </div>

                                                {/* Lesson rationale */}
                                                {result.recommendedLesson && (
                                                    <div className="flex items-center gap-2 text-xs text-[var(--nm-text-annotation)]">
                                                        <Clock size={12} />
                                                        <span className="font-[family-name:var(--font-data)]">
                                                            {result.recommendedLesson.rationale}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Divider */}
                                                <div className="h-px bg-[var(--nm-grid-line)]" />

                                                {/* Go to lesson button */}
                                                <div>
                                                    {topMatch.hasLesson ? (
                                                        <ActionButton
                                                            id="go-to-lesson-button"
                                                            variant="secondary"
                                                            className="w-full flex items-center justify-center gap-2"
                                                            onClick={() => handleGoToLesson(topMatch)}
                                                        >
                                                            {topMatch.isPro && !isPro ? (
                                                                <>
                                                                    <Lock size={14} />
                                                                    Ir para aula (Pro)
                                                                </>
                                                            ) : (
                                                                <>
                                                                    Ir para aula
                                                                    <ArrowRight size={14} />
                                                                </>
                                                            )}
                                                        </ActionButton>
                                                    ) : (
                                                        <ActionButton
                                                            variant="ghost"
                                                            className="w-full opacity-50 cursor-not-allowed"
                                                            disabled
                                                        >
                                                            <span className="flex items-center justify-center gap-2">
                                                                Em breve
                                                                <span className="px-1.5 py-0.5 text-[9px] font-[family-name:var(--font-data)] uppercase bg-[var(--nm-bg-main)] rounded-[var(--radius-technical)] border border-[var(--nm-grid-line)]">
                                                                    SOON
                                                                </span>
                                                            </span>
                                                        </ActionButton>
                                                    )}
                                                </div>
                                            </div>
                                        </BlueprintCard>
                                    </motion.div>
                                )}

                                {/* ─── Fallback Message ──────────────────────────── */}
                                {result.fallbackMessage && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <BlueprintCard label="FALLBACK" annotation="RECOMENDAÇÃO">
                                            <div className="flex items-start gap-3 py-2">
                                                <Sparkles size={18} className="text-[#F59E0B] mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-sm text-[var(--nm-text-dimmed)]">
                                                        {result.fallbackMessage}
                                                    </p>
                                                </div>
                                            </div>
                                        </BlueprintCard>
                                    </motion.div>
                                )}

                                {/* ─── Secondary Matches ─────────────────────────── */}
                                {secondaryMatches.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.25 }}
                                    >
                                        <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-3 mt-6">
                                            OUTROS_CONCEITOS_RELACIONADOS
                                        </div>
                                        <div className="space-y-2">
                                            {secondaryMatches.map((match, idx) => (
                                                <motion.div
                                                    key={match.conceptId}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.3 + idx * 0.1 }}
                                                >
                                                    <BlueprintCard
                                                        className="cursor-pointer hover:border-[var(--nm-text-annotation)]"
                                                        onClick={() => handleGoToLesson(match)}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                        <span className="text-sm font-medium text-[var(--nm-text-high)] truncate">
                                                                            {match.conceptName}
                                                                        </span>
                                                                        {match.isPro && (
                                                                            <span
                                                                                className="px-1.5 py-0.5 rounded text-[9px] font-[family-name:var(--font-data)] uppercase shrink-0"
                                                                                style={{
                                                                                    background: 'rgba(58, 114, 248, 0.15)',
                                                                                    color: '#3A72F8',
                                                                                }}
                                                                            >
                                                                                PRO
                                                                            </span>
                                                                        )}
                                                                        {!match.hasLesson && (
                                                                            <span
                                                                                className="px-1.5 py-0.5 rounded text-[9px] font-[family-name:var(--font-data)] uppercase shrink-0 text-[var(--nm-text-annotation)] border border-[var(--nm-grid-line)]"
                                                                            >
                                                                                EM BREVE
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-xs text-[var(--nm-text-annotation)]">
                                                                        {match.moduleName}
                                                                        <span className="mx-1.5">·</span>
                                                                        <span className="font-[family-name:var(--font-data)]">
                                                                            conf: {match.confidence.toFixed(2)}
                                                                        </span>
                                                                        <span className="mx-1.5">·</span>
                                                                        <span className="font-[family-name:var(--font-data)]">
                                                                            {getLayerLabel(match.matchLayer)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="ml-2 shrink-0">
                                                                <ArrowRight size={14} className="text-[var(--nm-text-annotation)]" />
                                                            </div>
                                                        </div>
                                                    </BlueprintCard>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* ─── Reset / Try Another ────────────────────────── */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-center pt-4"
                                >
                                    <button
                                        onClick={handleReset}
                                        className="text-sm text-[var(--nm-text-dimmed)] hover:text-[var(--nm-accent-primary)] transition-colors cursor-pointer"
                                    >
                                        Classificar outra operação
                                    </button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </main>

            <Footer />
            <MobileNav />

            {/* ─── Paywall Modal ──────────────────────────────────── */}
            <PaywallModal
                open={paywallOpen}
                onClose={() => setPaywallOpen(false)}
                moduleName={paywallModuleName}
            />
        </div>
    )
}
