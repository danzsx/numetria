import { Link, useNavigate, useSearchParams } from 'react-router';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { MobileNav } from '../components/MobileNav';
import { BlueprintCard } from '../components/BlueprintCard';
import { ActionButton } from '../components/ActionButton';
import { useState } from 'react';
import {
  Operation,
  Mode,
  TimerMode,
  getOperationName,
  getOperationSymbol,
  getLevelDescription,
  getLevel,
  TabuadaConfig,
  CONCEPT_CONFIG_MAP,
} from '../utils/tabuadaEngine';
import { useAdaptive } from '../../hooks/useAdaptive';
import { Loader2, TrendingUp, TrendingDown, Minus, Zap, BookOpen } from 'lucide-react';

// Mapeia nível 1-4 para rótulo exibido no botão
const LEVEL_LABELS: Record<number, string> = {
  1: 'Sequencial · Sem cronômetro',
  2: 'Aleatório · Sem cronômetro',
  3: 'Sequencial · Com cronômetro',
  4: 'Aleatório · Com cronômetro',
};

const LESSON_NAMES: Record<number, string> = { 1: 'Estrutura', 2: 'Compressão', 3: 'Ritmo' };

export default function TabuadaSetup() {
  const navigate = useNavigate();

  // Parâmetros de URL (modo guiado vindo de link direto com conceptId)
  const [searchParams] = useSearchParams();
  const conceptId = searchParams.get('conceptId') ? Number(searchParams.get('conceptId')) : null;
  const lessonNumber = searchParams.get('lessonNumber') ? Number(searchParams.get('lessonNumber')) : null;
  const isGuidedMode = !!conceptId;

  const conceptDef = conceptId ? CONCEPT_CONFIG_MAP[conceptId] : null;

  const [operation, setOperation] = useState<Operation>(conceptDef?.operation ?? 'multiplication');
  const [base, setBase] = useState<number>(conceptDef?.base ?? 7);
  const [mode, setMode] = useState<Mode>('sequential');
  const [timerMode, setTimerMode] = useState<TimerMode>('untimed');

  // Recomendação adaptativa: por conceito no modo guiado, global no modo livre
  const { recommendation, loading: loadingRec } = useAdaptive(isGuidedMode ? conceptId : null);

  const handleStart = () => {
    if (isGuidedMode && conceptDef) {
      // Modo guiado: config derivada do conceito + recomendação adaptativa
      const cfg: TabuadaConfig = {
        operation: conceptDef.operation,
        base: conceptDef.base,
        mode: (recommendation?.mode ?? 'sequential') as Mode,
        timerMode: (recommendation?.timer_mode ?? 'untimed') as TimerMode,
      };
      const params = new URLSearchParams({ conceptId: String(conceptId) });
      if (lessonNumber) params.set('lessonNumber', String(lessonNumber));
      navigate(`/tabuada/training?${params.toString()}`, { state: { config: cfg } });
    } else {
      const config: TabuadaConfig = { operation, base, mode, timerMode };
      navigate('/tabuada/training', { state: { config } });
    }
  };

  const applyRecommendation = () => {
    if (!recommendation) return;
    setMode(recommendation.mode as Mode);
    setTimerMode(recommendation.timer_mode as TimerMode);
  };

  const level = getLevel({ operation, base, mode, timerMode });
  const levelDescription = getLevelDescription(level);

  const getRecStatusIcon = (status: string) => {
    if (status === 'stable')    return <TrendingUp  size={14} />;
    if (status === 'unstable')  return <TrendingDown size={14} />;
    return <Minus size={14} />;
  };

  const getRecStatusColor = (status: string): string => {
    if (status === 'stable')   return 'var(--nm-accent-stability)';
    if (status === 'unstable') return 'var(--nm-accent-error)';
    return 'var(--nm-accent-primary)';
  };

  const isRecommendationActive =
    recommendation &&
    recommendation.mode === mode &&
    recommendation.timer_mode === timerMode;

  // Nível efetivo no modo guiado (derivado da recomendação)
  const guidedLevel = recommendation
    ? recommendation.level
    : 1;

  return (
    <div className="min-h-screen">
      <Header isLoggedIn={true} />

      <main className="pt-24 pb-16 px-6 mb-16 md:mb-0">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Link
              to={isGuidedMode ? '/modules' : '/modules'}
              className="text-sm text-[var(--nm-text-dimmed)] hover:text-[var(--nm-text-high)] transition-colors"
            >
              ← Voltar aos módulos
            </Link>
          </div>

          <div className="mb-12">
            <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-2">
              {isGuidedMode ? 'MODO_GUIADO' : 'TABUADA_ESTRUTURADA'}
            </div>
            <h1 className="text-3xl font-semibold text-[var(--nm-text-high)] mb-2">
              {isGuidedMode ? 'Treino por Conceito' : 'Configuração de Treino'}
            </h1>
            <p className="text-[var(--nm-text-dimmed)]">
              {isGuidedMode
                ? 'Configuração otimizada para o conceito selecionado'
                : 'Módulo de automação e estabilidade básica'}
            </p>
          </div>

          <div className="space-y-6">
            {/* ─── MODO GUIADO: card de conceito selecionado ─── */}
            {isGuidedMode && conceptDef && (
              <BlueprintCard
                label="CONCEITO_SELECIONADO"
                annotation={`AULA_${lessonNumber ?? 1}`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-[var(--radius-technical)] border border-[var(--nm-accent-primary)] bg-[var(--nm-bg-main)]">
                    <BookOpen size={18} className="text-[var(--nm-accent-primary)]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[var(--nm-text-high)] mb-1">
                      {conceptDef.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-[var(--nm-text-annotation)]">
                      <span className="font-[family-name:var(--font-data)] uppercase tracking-[0.08em]">
                        {getOperationName(conceptDef.operation)} · base {conceptDef.base}
                      </span>
                      <span>·</span>
                      <span className="font-[family-name:var(--font-data)] uppercase tracking-[0.08em]">
                        {LESSON_NAMES[lessonNumber ?? 1]}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-[var(--nm-text-dimmed)]">
                      <span className="font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.08em]">
                        Operação:
                      </span>
                      <span className="text-xl font-[family-name:var(--font-data)] text-[var(--nm-text-high)]">
                        {getOperationSymbol(conceptDef.operation)}
                      </span>
                    </div>
                  </div>
                </div>
              </BlueprintCard>
            )}

            {/* ─── MODO LIVRE: seletores manuais ─── */}
            {!isGuidedMode && (
              <>
                {/* Operação */}
                <BlueprintCard label="OPERAÇÃO">
                  <h3 className="text-lg font-semibold text-[var(--nm-text-high)] mb-4">
                    Tipo de operação
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {(['multiplication', 'division', 'addition', 'subtraction'] as Operation[]).map((op) => (
                      <button
                        key={op}
                        onClick={() => setOperation(op)}
                        className={`p-4 rounded-[var(--radius-technical)] border transition-colors ${
                          operation === op
                            ? 'border-[var(--nm-accent-primary)] bg-[var(--nm-bg-main)]'
                            : 'border-[var(--nm-grid-line)] bg-transparent hover:border-[var(--nm-text-annotation)]'
                        }`}
                      >
                        <div className="text-2xl font-[family-name:var(--font-data)] text-center mb-2">
                          {getOperationSymbol(op)}
                        </div>
                        <div className="text-sm text-[var(--nm-text-dimmed)] text-center">
                          {getOperationName(op)}
                        </div>
                      </button>
                    ))}
                  </div>
                </BlueprintCard>

                {/* Base numérica */}
                <BlueprintCard label="BASE">
                  <h3 className="text-lg font-semibold text-[var(--nm-text-high)] mb-4">
                    Número base
                  </h3>
                  <div className="grid grid-cols-5 gap-3">
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => (
                      <button
                        key={num}
                        onClick={() => setBase(num)}
                        className={`aspect-square p-4 rounded-[var(--radius-technical)] border transition-colors ${
                          base === num
                            ? 'border-[var(--nm-accent-primary)] bg-[var(--nm-bg-main)]'
                            : 'border-[var(--nm-grid-line)] bg-transparent hover:border-[var(--nm-text-annotation)]'
                        }`}
                      >
                        <div className="text-xl font-[family-name:var(--font-data)] text-[var(--nm-text-high)]">
                          {num}
                        </div>
                      </button>
                    ))}
                  </div>
                </BlueprintCard>

                {/* Modo de execução */}
                <BlueprintCard label="MODO">
                  <h3 className="text-lg font-semibold text-[var(--nm-text-high)] mb-4">
                    Sequência de apresentação
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setMode('sequential')}
                      className={`p-4 rounded-[var(--radius-technical)] border transition-colors ${
                        mode === 'sequential'
                          ? 'border-[var(--nm-accent-primary)] bg-[var(--nm-bg-main)]'
                          : 'border-[var(--nm-grid-line)] bg-transparent hover:border-[var(--nm-text-annotation)]'
                      }`}
                    >
                      <div className="text-sm font-semibold text-[var(--nm-text-high)] mb-1">Sequencial</div>
                      <div className="text-xs text-[var(--nm-text-dimmed)]">Ordem previsível</div>
                    </button>
                    <button
                      onClick={() => setMode('random')}
                      className={`p-4 rounded-[var(--radius-technical)] border transition-colors ${
                        mode === 'random'
                          ? 'border-[var(--nm-accent-primary)] bg-[var(--nm-bg-main)]'
                          : 'border-[var(--nm-grid-line)] bg-transparent hover:border-[var(--nm-text-annotation)]'
                      }`}
                    >
                      <div className="text-sm font-semibold text-[var(--nm-text-high)] mb-1">Aleatório</div>
                      <div className="text-xs text-[var(--nm-text-dimmed)]">Ordem embaralhada</div>
                    </button>
                  </div>
                </BlueprintCard>

                {/* Controle de tempo */}
                <BlueprintCard label="RITMO">
                  <h3 className="text-lg font-semibold text-[var(--nm-text-high)] mb-4">
                    Controle temporal
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setTimerMode('untimed')}
                      className={`p-4 rounded-[var(--radius-technical)] border transition-colors ${
                        timerMode === 'untimed'
                          ? 'border-[var(--nm-accent-primary)] bg-[var(--nm-bg-main)]'
                          : 'border-[var(--nm-grid-line)] bg-transparent hover:border-[var(--nm-text-annotation)]'
                      }`}
                    >
                      <div className="text-sm font-semibold text-[var(--nm-text-high)] mb-1">Sem cronômetro</div>
                      <div className="text-xs text-[var(--nm-text-dimmed)]">Foco em precisão</div>
                    </button>
                    <button
                      onClick={() => setTimerMode('timed')}
                      className={`p-4 rounded-[var(--radius-technical)] border transition-colors ${
                        timerMode === 'timed'
                          ? 'border-[var(--nm-accent-primary)] bg-[var(--nm-bg-main)]'
                          : 'border-[var(--nm-grid-line)] bg-transparent hover:border-[var(--nm-text-annotation)]'
                      }`}
                    >
                      <div className="text-sm font-semibold text-[var(--nm-text-high)] mb-1">Com cronômetro</div>
                      <div className="text-xs text-[var(--nm-text-dimmed)]">Controle de ritmo</div>
                    </button>
                  </div>
                </BlueprintCard>
              </>
            )}

            {/* ─── Recomendação Adaptativa ─── */}
            {loadingRec ? (
              <BlueprintCard label="MOTOR_ADAPTATIVO">
                <div className="flex items-center gap-2 text-[var(--nm-text-annotation)]">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-xs">Analisando histórico…</span>
                </div>
              </BlueprintCard>
            ) : recommendation ? (
              <BlueprintCard
                label="MOTOR_ADAPTATIVO"
                annotation={recommendation.session_count === 0 ? 'PRIMEIRO_TREINO' : `${recommendation.session_count}_SESSÕES`}
              >
                {/* Cabeçalho com status */}
                <div
                  className="flex items-center gap-2 mb-3"
                  style={{ color: getRecStatusColor(recommendation.last_status) }}
                >
                  {getRecStatusIcon(recommendation.last_status)}
                  <span className="text-xs font-[family-name:var(--font-data)] uppercase tracking-[0.1em]">
                    {recommendation.last_status === 'stable'
                      ? 'Estável'
                      : recommendation.last_status === 'unstable'
                      ? 'Instável'
                      : 'Consolidando'}
                  </span>
                  {recommendation.session_count > 0 && (
                    <span className="ml-auto text-xs text-[var(--nm-text-annotation)]">
                      precisão média {recommendation.avg_precision.toFixed(1)}%
                    </span>
                  )}
                </div>

                {/* Configuração recomendada */}
                <div className="flex items-center gap-3 mb-3 p-3 rounded-[var(--radius-technical)] bg-[var(--nm-bg-main)] border border-[var(--nm-grid-line)]">
                  <Zap size={14} className="text-[var(--nm-accent-primary)] shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-[var(--nm-text-high)]">
                      {isGuidedMode
                        ? `Nível ${guidedLevel} — ${LEVEL_LABELS[guidedLevel]}`
                        : `Nível ${recommendation.level} — ${LEVEL_LABELS[recommendation.level]}`}
                    </div>
                    <div className="text-xs text-[var(--nm-text-dimmed)] mt-0.5">
                      {getLevelDescription((isGuidedMode ? guidedLevel : recommendation.level) as 1 | 2 | 3 | 4).split('—')[0].trim()}
                    </div>
                  </div>
                </div>

                {/* Razão */}
                <p className="text-xs text-[var(--nm-text-annotation)] mb-4 leading-relaxed">
                  {recommendation.reason}
                </p>

                {/* Stats rápidos (só se há histórico) */}
                {recommendation.session_count > 0 && (
                  <div className="flex gap-4 mb-4 text-[10px] font-[family-name:var(--font-data)] text-[var(--nm-text-annotation)] uppercase tracking-[0.08em]">
                    <span>
                      <span
                        className="text-sm font-semibold"
                        style={{ color: 'var(--nm-accent-stability)' }}
                      >
                        {recommendation.stable_count}
                      </span>{' '}
                      estável
                    </span>
                    <span>
                      <span
                        className="text-sm font-semibold"
                        style={{ color: 'var(--nm-accent-error)' }}
                      >
                        {recommendation.unstable_count}
                      </span>{' '}
                      instável
                    </span>
                  </div>
                )}

                {/* Botão aplicar — apenas no modo livre */}
                {!isGuidedMode && (
                  <button
                    onClick={applyRecommendation}
                    disabled={!!isRecommendationActive}
                    className={`w-full py-2 px-4 rounded-[var(--radius-technical)] border text-sm transition-colors ${
                      isRecommendationActive
                        ? 'border-[var(--nm-accent-primary)] text-[var(--nm-accent-primary)] opacity-60 cursor-default'
                        : 'border-[var(--nm-accent-primary)] text-[var(--nm-accent-primary)] hover:bg-[var(--nm-accent-primary)] hover:text-[var(--nm-bg-main)]'
                    }`}
                  >
                    {isRecommendationActive ? '✓ Configuração recomendada aplicada' : 'Aplicar recomendação'}
                  </button>
                )}
              </BlueprintCard>
            ) : null}

            {/* Nível e início */}
            <BlueprintCard label={isGuidedMode ? `NÍVEL_0${guidedLevel}` : `NÍVEL_0${level}`}>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[var(--nm-text-high)] mb-2">
                  Configuração atual
                </h3>
                <p className="text-sm text-[var(--nm-text-dimmed)]">
                  {isGuidedMode
                    ? getLevelDescription(guidedLevel as 1 | 2 | 3 | 4)
                    : levelDescription}
                </p>
              </div>

              <div className="flex gap-3">
                <ActionButton
                  variant="primary"
                  onClick={handleStart}
                  className="flex-1"
                >
                  {isGuidedMode ? 'Iniciar aula' : 'Iniciar treino'}
                </ActionButton>
              </div>
            </BlueprintCard>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
