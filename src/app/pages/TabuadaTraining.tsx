import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router';
import { InputField } from '../components/InputField';
import { motion, AnimatePresence } from 'motion/react';
import {
  TabuadaConfig,
  Problem,
  getOperationName,
  getOperationSymbol,
  getLevel,
  CONCEPT_CONFIG_MAP,
  Mode,
  TimerMode,
  ProMode,
  adjustTimer,
  generateProblems,
} from '../utils/tabuadaEngine';
import { useSession } from '../../hooks/useSession';
import { adaptiveService } from '../../services/adaptive.service';
import { userService } from '../../services/user.service';
import { Loader2 } from 'lucide-react';
import { Breadcrumb } from '../components/Breadcrumb';
import {
  buildJourneyContext,
  getLessonLabel,
  getModuleFromConceptId,
} from '../utils/moduleContext';
import type { ModuleJourneyContext } from '../utils/moduleContext';
import {
  createConceptLessonEngine,
  lessonNumberToConceptMode,
} from '../utils/conceptLessonEngine';
import { trackFlowEvent } from '../utils/flowTelemetry';


export default function TabuadaTraining() {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const trainingOpenedAtRef = useRef<number>(Date.now());
  const lessonReadyTrackedRef = useRef(false);

  // Parâmetros de URL (modo guiado vindo dos Módulos)
  const [searchParams] = useSearchParams();
  const conceptId = searchParams.get('conceptId') ? Number(searchParams.get('conceptId')) : null;
  const lessonNumber = searchParams.get('lessonNumber') ? Number(searchParams.get('lessonNumber')) : null;

  // Config pode vir de location.state (Setup) ou ser construída async (Módulos direto)
  const stateConfig = (location.state as any)?.config as TabuadaConfig | undefined;
  const stateModuleJourney = (location.state as any)?.moduleJourney as ModuleJourneyContext | undefined;
  const inferredJourney = conceptId && lessonNumber ? buildJourneyContext(conceptId, lessonNumber) : null;
  const moduleJourney = stateModuleJourney ?? inferredJourney;
  const moduleIdForSession =
    moduleJourney?.moduleId ?? (conceptId ? getModuleFromConceptId(conceptId)?.id ?? null : null);

  // Deriva o PRO mode a partir do conceptId (estável durante toda a sessão)
  const proMode: ProMode | null = (() => {
    if (!conceptId) return null;
    if (conceptId >= 16 && conceptId <= 18) return 'flow';
    if (conceptId >= 19 && conceptId <= 21) return 'rhythm';
    if (conceptId >= 22 && conceptId <= 24) return 'precision';
    return null;
  })();

  const { startSession, recordAttempt, finishSession, saving, saveError } = useSession();

  const resolveConceptConfig = (
    cfg: TabuadaConfig,
    currentConceptId: number,
    currentLessonNumber: number,
    currentModuleId: string | null,
    currentProMode: ProMode | null
  ): { config: TabuadaConfig; problems: Problem[] } => {
    const lessonOutput = createConceptLessonEngine({
      moduleId: currentModuleId ?? 'foundational',
      conceptId: currentConceptId,
      lessonNumber: (currentLessonNumber === 1 || currentLessonNumber === 2 || currentLessonNumber === 3
        ? currentLessonNumber
        : 1) as 1 | 2 | 3,
      mode: lessonNumberToConceptMode(currentLessonNumber),
      difficultyTier: Math.min(4, Math.max(1, getLevel(cfg))) as 1 | 2 | 3 | 4,
      adaptiveProfile: {
        mode: cfg.mode,
        timerMode: currentProMode === 'rhythm' ? 'timed' : cfg.timerMode,
        proMode: currentProMode,
      },
    });

    return {
      config: {
        ...cfg,
        operation: lessonOutput.lessonPlan.operation,
        base: lessonOutput.lessonPlan.base,
        timerMode: lessonOutput.timerPolicy.timerMode,
      },
      problems: lessonOutput.questionSet,
    };
  };

  const [resolvedConfig, setResolvedConfig] = useState<TabuadaConfig | null>(stateConfig ?? null);
  const [configLoading, setConfigLoading] = useState(!stateConfig && !!conceptId);
  const [problems, setProblems] = useState<Problem[]>(() => {
    if (!stateConfig) return [];

    if (conceptId) {
      return resolveConceptConfig(
        stateConfig,
        conceptId,
        lessonNumber ?? 1,
        moduleIdForSession,
        proMode
      ).problems;
    }

    return generateProblems(stateConfig);
  });

  const sessionStartedRef = useRef(false);

  // Refs para dados mutáveis — evita problemas de closures em handlers assíncronos
  const timesRef = useRef<number[]>([]);
  const correctCountRef = useRef(0);

  // Declarados aqui para evitar TDZ no dep array do useEffect abaixo
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentProblem = problems[currentIndex];

  // Guard PRO: redirecionar para /pro se conceptId >= 16 e usuário não é Pro
  useEffect(() => {
    if (conceptId === null || conceptId < 16) return;

    userService.getPlanStatus().then(status => {
      if (!status.is_active) {
        navigate('/pro', { state: { from: location.pathname + location.search }, replace: true });
      }
    }).catch(() => {
      // Em caso de erro de rede, não bloquear o usuário
    });
  }, [conceptId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!moduleJourney) return;
    trackFlowEvent('module_training_opened', {
      moduleId: moduleJourney.moduleId,
      moduleName: moduleJourney.moduleName,
      conceptId: moduleJourney.conceptId,
      conceptName: moduleJourney.conceptName,
      lessonNumber: moduleJourney.lessonNumber,
    });
  }, [moduleJourney]);

  useEffect(() => {
    if (!moduleJourney || configLoading || !resolvedConfig || !currentProblem) return;
    if (lessonReadyTrackedRef.current) return;
    lessonReadyTrackedRef.current = true;
    const loadTimeMs = Date.now() - trainingOpenedAtRef.current;
    trackFlowEvent('module_lesson_ready', {
      moduleId: moduleJourney.moduleId,
      moduleName: moduleJourney.moduleName,
      conceptId: moduleJourney.conceptId,
      conceptName: moduleJourney.conceptName,
      lessonNumber: moduleJourney.lessonNumber,
      loadTimeMs,
      totalProblems: problems.length,
      timerMode: resolvedConfig.timerMode,
    });
  }, [configLoading, currentProblem, moduleJourney, problems.length, resolvedConfig]);

  useEffect(() => {
    // Caso 1: config veio via location.state (fluxo Setup → Training)
    if (stateConfig) {
      const configToUse =
        conceptId
          ? resolveConceptConfig(
              stateConfig,
              conceptId,
              lessonNumber ?? 1,
              moduleIdForSession,
              proMode
            ).config
          : stateConfig;
      setResolvedConfig(configToUse);

      if (!sessionStartedRef.current) {
        sessionStartedRef.current = true;
        startSession(configToUse, conceptId, lessonNumber, moduleIdForSession);
      }
      return;
    }

    // Caso 2: sem config e sem conceptId → redirecionar para setup
    if (!conceptId) {
      navigate('/tabuada/setup');
      return;
    }

    // Caso 3: vindo dos Módulos direto (URL params, sem state config)
    const conceptDef = CONCEPT_CONFIG_MAP[conceptId] ?? { operation: 'multiplication' as const, base: 7 };

    adaptiveService.getRecommendation(conceptId).then(rec => {
      const adaptiveConfig: TabuadaConfig = {
        operation: conceptDef.operation,
        base: conceptDef.base,
        mode: (rec?.mode ?? 'sequential') as Mode,
        timerMode: (rec?.timer_mode ?? 'untimed') as TimerMode,
      };
      const withConceptEngine =
        conceptId != null
          ? resolveConceptConfig(
              adaptiveConfig,
              conceptId,
              lessonNumber ?? 1,
              moduleIdForSession,
              proMode
            )
          : { config: adaptiveConfig, problems: generateProblems(adaptiveConfig) };

      setResolvedConfig(withConceptEngine.config);
      setProblems(withConceptEngine.problems);
      setConfigLoading(false);

      if (!sessionStartedRef.current) {
        sessionStartedRef.current = true;
        startSession(
          withConceptEngine.config,
          conceptId,
          lessonNumber,
          moduleIdForSession
        );
      }
    }).catch(() => {
      navigate('/tabuada/setup');
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Estado da sessão ────────────────────────────────────────

  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [problemStartTime, setProblemStartTime] = useState(Date.now());
  const [correctCount, setCorrectCount] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [isShowingFeedback, setIsShowingFeedback] = useState(false);

  // Rhythm mode
  const [timeLimit, setTimeLimit] = useState(5000);
  const [consecutiveSubTime, setConsecutiveSubTime] = useState(0);
  const [rhythmTimeRemaining, setRhythmTimeRemaining] = useState(5000);
  const [timedOut, setTimedOut] = useState(false);

  // Precision mode
  const [answeredCount, setAnsweredCount] = useState(0);
  const [showStructureAlert, setShowStructureAlert] = useState(false);

  const totalProblems = problems.length;
  const level = resolvedConfig ? getLevel(resolvedConfig) : 1;

  // Cronômetro crescente para modo timed normal (não rhythm)
  useEffect(() => {
    if (resolvedConfig?.timerMode === 'timed' && !sessionComplete && proMode !== 'rhythm') {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - problemStartTime);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [resolvedConfig?.timerMode, problemStartTime, sessionComplete, proMode]);

  // Rhythm mode: timer regressivo por questão
  // Reinicia quando currentIndex, timeLimit, isShowingFeedback ou sessionComplete mudam
  useEffect(() => {
    if (proMode !== 'rhythm' || sessionComplete || isShowingFeedback || !resolvedConfig) return;

    setRhythmTimeRemaining(timeLimit);
    const startTime = Date.now();

    const timer = setInterval(() => {
      const remaining = Math.max(0, timeLimit - (Date.now() - startTime));
      setRhythmTimeRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        setTimedOut(true);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [currentIndex, isShowingFeedback, proMode, timeLimit, sessionComplete, resolvedConfig]);

  // Rhythm mode: processa timeout (avança para próxima questão como erro)
  useEffect(() => {
    if (!timedOut || sessionComplete || !currentProblem || !resolvedConfig) return;
    setTimedOut(false);
    setConsecutiveSubTime(0);

    recordAttempt({ problem: currentProblem, userAnswer: -1, isCorrect: false, timeMs: timeLimit });

    const newTimes = [...timesRef.current, timeLimit];
    timesRef.current = newTimes;
    setTimes(newTimes);

    if (currentIndex < totalProblems - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserAnswer('');
      setFeedback(null);
      setIsShowingFeedback(false);
      inputRef.current?.focus();
    } else {
      (async () => {
        await handleComplete(correctCountRef.current, newTimes);
      })();
    }
  }, [timedOut, sessionComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!configLoading) {
      inputRef.current?.focus();
    }
  }, [configLoading]);

  // ─── Handlers ────────────────────────────────────────────────

  const handleComplete = async (finalCorrectCount: number, finalTimes: number[]) => {
    setSessionComplete(true);
    const { metrics, analysis, result } = await finishSession(finalCorrectCount, totalProblems, finalTimes);

    if (moduleJourney) {
      trackFlowEvent('module_lesson_completed', {
        moduleId: moduleJourney.moduleId,
        moduleName: moduleJourney.moduleName,
        conceptId: moduleJourney.conceptId,
        conceptName: moduleJourney.conceptName,
        lessonNumber: moduleJourney.lessonNumber,
        sessionId: result?.session_id ?? null,
        sessionStatus: analysis.status,
        precisionPct: metrics.precision,
      });
    }

    if (result?.new_status === 'mastered') {
      console.log('[analytics] concept_mastered', { conceptId, lessonNumber });
    }

    navigate('/tabuada/result', {
      state: {
        metrics,
        analysis,
        config: resolvedConfig,
        conceptId,
        lessonNumber,
        proMode,
        result,
        moduleJourney,
      },
    });
  };

  const handleSubmit = () => {
    if (!currentProblem || !resolvedConfig || sessionComplete) return;

    const answer = parseInt(userAnswer);
    if (isNaN(answer)) return;

    const timeTaken = Date.now() - problemStartTime;
    const isCorrect = answer === currentProblem.correctAnswer;

    recordAttempt({ problem: currentProblem, userAnswer: answer, isCorrect, timeMs: timeTaken });

    // Precision mode: rastreia contagem e dispara alerta se precisão < 80% após 5 questões
    if (proMode === 'precision') {
      const newAnswered = answeredCount + 1;
      setAnsweredCount(newAnswered);
      if (newAnswered >= 5 && !showStructureAlert) {
        const runningPrecision = ((isCorrect ? correctCount + 1 : correctCount) / newAnswered) * 100;
        if (runningPrecision < 80) {
          setShowStructureAlert(true);
        }
      }
    }

    if (isCorrect) {
      const newTimes = [...timesRef.current, timeTaken];
      const newCorrectCount = correctCountRef.current + 1;
      timesRef.current = newTimes;
      correctCountRef.current = newCorrectCount;
      setTimes(newTimes);
      setCorrectCount(newCorrectCount);

      // Rhythm mode: ajuste adaptativo do timer
      if (proMode === 'rhythm') {
        const wasSubTime = timeTaken < timeLimit;
        if (wasSubTime) {
          const newConsecutive = consecutiveSubTime + 1;
          setConsecutiveSubTime(newConsecutive);
          const newLimit = adjustTimer(newConsecutive, timeLimit);
          if (newLimit !== timeLimit) {
            setTimeLimit(newLimit);
            console.log('[analytics] adaptive_adjustment', {
              from: timeLimit,
              to: newLimit,
              consecutiveCount: newConsecutive,
            });
          }
        } else {
          setConsecutiveSubTime(0);
        }
      }

      if (proMode === 'flow') {
        // Flow mode: avança imediatamente, sem feedback visual
        if (currentIndex < totalProblems - 1) {
          setCurrentIndex(prev => prev + 1);
          setUserAnswer('');
          setProblemStartTime(Date.now());
          setElapsedTime(0);
          inputRef.current?.focus();
        } else {
          handleComplete(newCorrectCount, newTimes);
        }
      } else {
        // Normal / Rhythm / Precision: exibe feedback breve
        const timeInSeconds = (timeTaken / 1000).toFixed(1);
        setFeedback(`Execução estável.${resolvedConfig.timerMode === 'timed' ? ' ' + timeInSeconds + 's' : ''}`);
        setIsError(false);
        setIsShowingFeedback(true);

        setTimeout(async () => {
          setIsShowingFeedback(false);
          if (currentIndex < totalProblems - 1) {
            setCurrentIndex(prev => prev + 1);
            setUserAnswer('');
            setFeedback(null);
            setProblemStartTime(Date.now());
            setElapsedTime(0);
            inputRef.current?.focus();
          } else {
            await handleComplete(newCorrectCount, newTimes);
          }
        }, 1200);
      }
    } else {
      // Resposta errada
      const newTimes = [...timesRef.current, timeTaken];
      timesRef.current = newTimes;
      setTimes(newTimes);

      if (proMode === 'rhythm') {
        setConsecutiveSubTime(0);
      }

      if (proMode === 'flow') {
        // Flow mode: avança mesmo no erro, sem mostrar feedback
        if (currentIndex < totalProblems - 1) {
          setCurrentIndex(prev => prev + 1);
          setUserAnswer('');
          setProblemStartTime(Date.now());
          setElapsedTime(0);
          inputRef.current?.focus();
        } else {
          handleComplete(correctCountRef.current, newTimes);
        }
      } else {
        // Normal / Rhythm / Precision: mostra erro, usuário re-tenta a mesma questão
        setFeedback('Desvio de recuperação.');
        setIsError(true);
        setIsShowingFeedback(true);

        setTimeout(() => {
          setIsShowingFeedback(false);
          setIsError(false);
          setUserAnswer('');
          setFeedback(null);
          setProblemStartTime(Date.now());
          setElapsedTime(0);
          inputRef.current?.focus();
        }, 1500);
      }
    }
  };

  const handleExit = () => {
    if (moduleJourney) {
      trackFlowEvent('module_training_exit_to_module', {
        moduleId: moduleJourney.moduleId,
        moduleName: moduleJourney.moduleName,
        conceptId: moduleJourney.conceptId,
        lessonNumber: moduleJourney.lessonNumber,
      });
      navigate(`/modules/${moduleJourney.moduleId}`);
      return;
    }

    if (conceptId) {
      const module = getModuleFromConceptId(conceptId);
      if (module) {
        navigate(`/modules/${module.id}`);
        return;
      }
      navigate(-1);
      return;
    }

    navigate('/tabuada/setup');
  };

  // ─── Loading ─────────────────────────────────────────────────

  if (configLoading) {
    return (
      <div className="fixed inset-0 bg-[var(--nm-bg-main)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={24} className="text-[var(--nm-accent-primary)] animate-spin mx-auto mb-3" />
          <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em]">
            CARREGANDO_CONFIGURAÇÃO
          </div>
        </div>
      </div>
    );
  }

  if (!resolvedConfig || !currentProblem) {
    return null;
  }

  // ─── Render helpers ──────────────────────────────────────────

  const operationName = getOperationName(resolvedConfig.operation);
  // Precision mode: símbolo muda por problema (alternância mult/div)
  const displaySymbol = proMode === 'precision'
    ? getOperationSymbol(currentProblem.operation)
    : getOperationSymbol(resolvedConfig.operation);
  const conceptName = conceptId ? CONCEPT_CONFIG_MAP[conceptId]?.name : null;

  const proModeLabel: Record<ProMode, string> = {
    flow: 'FLOW_MODE',
    rhythm: 'SMART_TIMER',
    precision: 'PRECISION_MODE',
  };

  return (
    <div className="fixed inset-0 bg-[var(--nm-bg-main)] flex items-center justify-center">
      {/* Breadcrumb (modo guiado) ou botão Sair (treino livre) */}
      <div className="absolute top-6 left-6">
        {conceptId ? (
          <Breadcrumb
            items={(() => {
              const journey = moduleJourney ?? (conceptId && lessonNumber ? buildJourneyContext(conceptId, lessonNumber) : null)
              return [
                { label: 'Modulos', href: '/modules' },
                ...(journey
                  ? [{ label: journey.moduleName, href: `/modules/${journey.moduleId}` }]
                  : []),
                ...(journey
                  ? [{ label: journey.conceptName }]
                  : []),
                { label: `Aula ${lessonNumber ?? 1} - ${getLessonLabel(lessonNumber ?? 1)}` },
              ]
            })()}
          />
        ) : (
          <button
            onClick={handleExit}
            className="text-[var(--nm-text-dimmed)] hover:text-[var(--nm-text-high)] text-sm transition-colors"
          >
            ← Sair
          </button>
        )}
      </div>

      {/* Top center label */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center">
        <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em]">
          {conceptName
            ? `CONCEITO_${String(conceptId).padStart(2, '0')} // AULA_${lessonNumber ?? 1}`
            : `TABUADA_NÍVEL_${String(level).padStart(2, '0')} // 2026`}
        </div>
        <div className="text-[var(--nm-text-dimmed)] text-xs mt-2">
          {conceptName ?? `${operationName} por ${resolvedConfig.base}`} // Questão {currentIndex + 1}/{totalProblems}
        </div>
        {proMode && (
          <div className="text-[var(--nm-accent-primary)] font-[family-name:var(--font-data)] text-[9px] uppercase tracking-[0.15em] mt-1">
            {proModeLabel[proMode]}
          </div>
        )}
      </div>

      {/* Top right: timer display */}
      <div className="absolute top-6 right-6">
        {proMode === 'flow' ? null : proMode === 'rhythm' ? (
          <div className="text-right">
            <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-1">
              LIMITE
            </div>
            <div className={`font-[family-name:var(--font-data)] text-lg tabular-nums transition-colors ${
              rhythmTimeRemaining < 1500 ? 'text-[var(--nm-accent-error)]' : 'text-[var(--nm-text-high)]'
            }`}>
              {(rhythmTimeRemaining / 1000).toFixed(1)}s
            </div>
            <div className="text-[10px] text-[var(--nm-text-annotation)]">
              / {(timeLimit / 1000).toFixed(1)}s
            </div>
          </div>
        ) : resolvedConfig.timerMode === 'timed' ? (
          <div className="text-right">
            <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-1">
              TEMPO
            </div>
            <div className="text-[var(--nm-text-high)] font-[family-name:var(--font-data)] text-lg tabular-nums">
              {(elapsedTime / 1000).toFixed(1)}s
            </div>
          </div>
        ) : (
          <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em]">
            STABILITY_MODE
          </div>
        )}
      </div>

      {/* Precision mode: alerta de estrutura */}
      {showStructureAlert && proMode === 'precision' && (
        <div className="absolute top-20 left-6 right-6">
          <div className="p-3 rounded-[var(--radius-technical)] border border-[var(--nm-accent-error)] bg-[var(--nm-bg-surface)]">
            <div className="text-[10px] font-[family-name:var(--font-data)] uppercase tracking-[0.1em] text-[var(--nm-accent-error)]">
              Precisão abaixo de 80% — considere revisar a estrutura técnica
            </div>
          </div>
        </div>
      )}

      {/* Saving indicator */}
      {(saving || saveError) && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          {saving && (
            <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em]">
              SALVANDO...
            </div>
          )}
          {saveError && (
            <div className="text-[var(--nm-accent-error)] text-xs">
              {saveError}
            </div>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="w-full max-w-md px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className="text-center"
          >
            {/* Precision mode: label da operação atual */}
            {proMode === 'precision' && (
              <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-4">
                {currentProblem.operation === 'multiplication' ? 'MULTIPLICAÇÃO' : 'DIVISÃO'}
              </div>
            )}

            {/* Question */}
            <div className="mb-12">
              <div className="text-[64px] md:text-[80px] lg:text-[96px] font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums leading-none mb-4">
                {currentProblem.operand1}
              </div>
              <div className="text-xl md:text-2xl text-[var(--nm-text-dimmed)] font-[family-name:var(--font-data)] mb-2">
                {displaySymbol} {currentProblem.operand2}
              </div>
            </div>

            {/* Input */}
            <div className="mb-8">
              <InputField
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value.replace(/\D/g, ''))}
                onEnter={handleSubmit}
                error={isError}
                placeholder="?"
                className="text-2xl md:text-3xl lg:text-4xl"
                autoFocus
              />
            </div>

            {/* Feedback — oculto em flow mode */}
            {proMode !== 'flow' && (
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.25 }}
                    className={`text-sm font-[family-name:var(--font-data)] ${
                      isError
                        ? 'text-[var(--nm-accent-error)]'
                        : 'text-[var(--nm-accent-stability)]'
                    }`}
                  >
                    {feedback}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Instructions */}
        <div className="text-center mt-12 text-xs text-[var(--nm-text-annotation)]">
          {proMode === 'flow'
            ? 'Modo fluxo ativo — responda sem pausas'
            : 'Pressione Enter para confirmar'}
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--nm-bg-surface)]">
        <motion.div
          className="h-full bg-[var(--nm-accent-primary)]"
          initial={{ width: '0%' }}
          animate={{ width: `${((currentIndex + 1) / totalProblems) * 100}%` }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </div>
    </div>
  );
}
