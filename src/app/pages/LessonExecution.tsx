import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router';
import { InputField } from '../components/InputField';
import { BlueprintCard } from '../components/BlueprintCard';
import { ActionButton } from '../components/ActionButton';
import { StabilityIndicator } from '../components/StabilityIndicator';
import { motion, AnimatePresence } from 'motion/react';
import {
  TabuadaConfig,
  Problem,
  generateProblems,
  getOperationName,
  getOperationSymbol,
  getLevel,
  Operation,
  calculateMetrics,
  analyzeFeedback,
  SessionMetrics,
} from '../utils/tabuadaEngine';
import { useSession } from '../../hooks/useSession';
import { useAdaptive } from '../../hooks/useAdaptive';
import { ProblemAttempt } from '../../services/session.service';
import { getLessonContent } from '../../data/lessonContent';
import { LessonContent, ConsolidationQuestion, WarmupQuestion } from '../../types/lesson';
import { StepBlock } from '../components/lesson/StepBlock';
import { GuidedStepInput } from '../components/lesson/GuidedStepInput';

// ─── Símbolos de operação ─────────────────────────────────────

const OP_SYMBOLS: Record<string, string> = {
  multiplication: '×',
  division:       '÷',
  addition:       '+',
  subtraction:    '−',
};

function getDisplayString(q: ConsolidationQuestion | WarmupQuestion): string {
  const sym = OP_SYMBOLS[q.operation] ?? q.operation;
  const operand3 = 'operand3' in q ? (q as ConsolidationQuestion).operand3 : undefined;
  if (operand3 !== undefined) {
    return `${q.operand1} ${sym} ${q.operand2} ${sym} ${operand3}`;
  }
  return `${q.operand1} ${sym} ${q.operand2}`;
}

// ─── Mapeamento concept_id → config base ─────────────────────
// Lesson 2 usa mode: random / timerMode: untimed
// Lesson 3 usa mode: random / timerMode: timed

const CONCEPT_CONFIG: Record<number, { operation: Operation; base: number }> = {
  1:  { operation: 'multiplication', base: 5  },
  2:  { operation: 'addition',       base: 10 },
  3:  { operation: 'multiplication', base: 9  },
  4:  { operation: 'division',       base: 2  },
  5:  { operation: 'multiplication', base: 2  },
  6:  { operation: 'addition',       base: 5  },
  7:  { operation: 'subtraction',    base: 5  },
  8:  { operation: 'multiplication', base: 10 },
  9:  { operation: 'subtraction',    base: 7  },
  10: { operation: 'multiplication', base: 3  },
  11: { operation: 'division',       base: 3  },
  12: { operation: 'multiplication', base: 7  },
  13: { operation: 'division',       base: 4  },
  14: { operation: 'multiplication', base: 11 },
  15: { operation: 'division',       base: 7  },
};

function getConfigForLesson(conceptId: number, lessonNumber: number): TabuadaConfig {
  const base = CONCEPT_CONFIG[conceptId] ?? { operation: 'multiplication' as Operation, base: conceptId };
  return {
    operation: base.operation,
    base: base.base,
    mode: lessonNumber >= 2 ? 'random' : 'sequential',
    timerMode: lessonNumber >= 3 ? 'timed' : 'untimed',
  };
}

// ─── Componente raiz ─────────────────────────────────────────

export default function LessonExecution() {
  const { conceptId: conceptIdParam, lessonNumber: lessonNumberParam } = useParams();
  const conceptId = parseInt(conceptIdParam ?? '0');
  const lessonNumber = parseInt(lessonNumberParam ?? '0');

  if (isNaN(conceptId) || isNaN(lessonNumber) || conceptId <= 0 || lessonNumber <= 0) {
    return <InvalidLesson />;
  }

  if (lessonNumber === 1) {
    return <LessonTypeStructure conceptId={conceptId} />;
  }

  return <LessonTraining conceptId={conceptId} lessonNumber={lessonNumber} />;
}

// ─── Aula 1 — Estrutura (Blocos 1, 4, 5, 6) ─────────────────

interface CombinedSessionData {
  correctCount: number;
  times: number[];
  totalProblems: number;
  metrics: SessionMetrics;
  analysis: {
    status: 'stable' | 'consolidating' | 'unstable';
    message: string;
    recommendation?: string;
  };
}

function LessonTypeStructure({ conceptId }: { conceptId: number }) {
  const navigate = useNavigate();
  const content = getLessonContent(conceptId, 1);
  const config = getConfigForLesson(conceptId, 1);
  const { startSession, recordAttempt, finishSession, saving, saveError } = useSession();

  const [currentBlock, setCurrentBlock] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [block4Data, setBlock4Data] = useState<{ correctCount: number; times: number[] } | null>(null);
  const [sessionData, setSessionData] = useState<CombinedSessionData | null>(null);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    startSession(config, conceptId, 1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!content) {
    return (
      <div className="min-h-screen bg-[var(--nm-bg-main)] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-[var(--nm-text-annotation)] text-sm mb-4">
            Conteúdo não disponível para este conceito.
          </div>
          <Link to="/modules" className="text-sm text-[var(--nm-accent-primary)]">
            Voltar aos módulos
          </Link>
        </div>
      </div>
    );
  }

  // Mapeamento bloco → % progresso (6 blocos completos)
  const blockProgress: Record<number, number> = { 1: 17, 2: 33, 3: 50, 4: 67, 5: 83, 6: 100 };

  const handleBlock1Complete = () => setCurrentBlock(2);
  const handleBlock2Complete = () => setCurrentBlock(3);
  const handleBlock3Complete = () => setCurrentBlock(4);

  const handleBlock4Complete = (correctCount: number, times: number[]) => {
    setBlock4Data({ correctCount, times });
    setCurrentBlock(5);
  };

  const handleBlock5Complete = (correctCount: number, times: number[]) => {
    const b4 = block4Data ?? { correctCount: 0, times: [] };
    const totalCorrect = b4.correctCount + correctCount;
    const allTimes = [...b4.times, ...times];
    const totalProblems = content.consolidation.length + content.compression.length;
    const metrics = calculateMetrics(totalCorrect, totalProblems, allTimes);
    const analysis = analyzeFeedback(metrics, config);
    setSessionData({ correctCount: totalCorrect, times: allTimes, totalProblems, metrics, analysis });
    setCurrentBlock(6);
  };

  const handleFinish = async () => {
    if (!sessionData || finishing) return;
    setFinishing(true);
    const { metrics, analysis, result } = await finishSession(
      sessionData.correctCount,
      sessionData.totalProblems,
      sessionData.times
    );
    navigate(`/lesson/${conceptId}/1/result`, {
      state: { metrics, analysis, conceptId, lessonNumber: 1, result },
    });
  };

  return (
    <div className="fixed inset-0 bg-[var(--nm-bg-main)] flex flex-col">
      {/* Header */}
      <div className="relative flex-shrink-0 pt-6 pb-3 px-6 text-center">
        <button
          onClick={() => navigate('/modules')}
          className="absolute top-6 left-6 text-[var(--nm-text-dimmed)] hover:text-[var(--nm-text-high)] text-sm transition-colors"
        >
          ← Sair
        </button>
        <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em]">
          AULA_ESTRUTURA // CONCEPT_{String(conceptId).padStart(2, '0')} // BLOCO_{currentBlock}
        </div>
        <div className="text-[var(--nm-text-dimmed)] text-xs mt-1">
          {content.title} — {content.techniqueName}
        </div>
      </div>

      {/* Block content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {currentBlock === 1 && (
            <motion.div
              key="block1"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <Block1Warmup content={content} onComplete={handleBlock1Complete} />
            </motion.div>
          )}
          {currentBlock === 2 && (
            <motion.div
              key="block2"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <StepBlock
                techniqueName={content.techniqueName}
                techniqueRule={content.techniqueRule}
                example={content.technique.example}
                steps={content.technique.steps}
                conclusion={content.technique.conclusion}
                onComplete={handleBlock2Complete}
              />
            </motion.div>
          )}
          {currentBlock === 3 && (
            <motion.div
              key="block3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <Block3Guided content={content} onComplete={handleBlock3Complete} />
            </motion.div>
          )}
          {currentBlock === 4 && (
            <motion.div
              key="block4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <Block4Consolidation
                content={content}
                recordAttempt={recordAttempt}
                onComplete={handleBlock4Complete}
              />
            </motion.div>
          )}
          {currentBlock === 5 && (
            <motion.div
              key="block5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <Block5Compression
                content={content}
                recordAttempt={recordAttempt}
                onComplete={handleBlock5Complete}
              />
            </motion.div>
          )}
          {currentBlock === 6 && sessionData && (
            <motion.div
              key="block6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <Block6Synthesis
                content={content}
                sessionData={sessionData}
                onFinish={handleFinish}
                saving={saving || finishing}
                saveError={saveError}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="flex-shrink-0 h-[2px] bg-[var(--nm-bg-surface)]">
        <motion.div
          className="h-full bg-[var(--nm-accent-primary)]"
          animate={{ width: `${blockProgress[currentBlock] ?? 0}%` }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </div>
    </div>
  );
}

// ─── Bloco 1: Aquecimento Neural ──────────────────────────────

function Block1Warmup({
  content,
  onComplete,
}: {
  content: LessonContent;
  onComplete: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isError, setIsError] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; correctAnswer: number } | null>(null);
  const [allDone, setAllDone] = useState(false);

  const questions = content.warmup;
  const question = questions[index];
  const isLast = index === questions.length - 1;

  useEffect(() => {
    if (!allDone) inputRef.current?.focus();
  }, [index, allDone]);

  const handleSubmit = () => {
    const num = parseInt(answer);
    if (isNaN(num) || !question || feedback) return;

    const isCorrect = num === question.answer;
    setFeedback({ correct: isCorrect, correctAnswer: question.answer });
    setIsError(!isCorrect);

    if (isLast) {
      setTimeout(() => setAllDone(true), isCorrect ? 600 : 1400);
    } else {
      setTimeout(() => {
        setIndex(i => i + 1);
        setAnswer('');
        setFeedback(null);
        setIsError(false);
      }, isCorrect ? 800 : 1500);
    }
  };

  if (allDone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
        <div className="max-w-sm w-full text-center">
          <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-6">
            AQUECIMENTO_CONCLUÍDO
          </div>
          <p className="text-[var(--nm-text-dimmed)] text-sm mb-8 leading-relaxed">
            Sistema preparado. Agora você aprende a técnica estrutural.
          </p>
          <ActionButton variant="primary" onClick={onComplete} className="w-full">
            Continuar para a técnica →
          </ActionButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-1">
            AQUECIMENTO_NEURAL
          </div>
          <div className="text-[var(--nm-text-dimmed)] text-xs">
            {index + 1} / {questions.length}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="text-center mb-8"
          >
            <div className="text-5xl font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums mb-2">
              {getDisplayString(question)}
            </div>
            <div className="text-[var(--nm-text-annotation)] text-sm">= ?</div>
          </motion.div>
        </AnimatePresence>

        <div className="mb-4">
          <InputField
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={answer}
            onChange={(e) => setAnswer(e.target.value.replace(/\D/g, ''))}
            onEnter={handleSubmit}
            error={isError}
            placeholder="?"
            className="text-2xl"
            disabled={!!feedback}
          />
        </div>

        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`text-center text-sm font-[family-name:var(--font-data)] ${
                feedback.correct ? 'text-[var(--nm-accent-stability)]' : 'text-[var(--nm-accent-error)]'
              }`}
            >
              {feedback.correct ? 'Correto.' : `Resposta: ${feedback.correctAnswer}`}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center mt-8 text-xs text-[var(--nm-text-annotation)]">
          Pressione Enter para confirmar
        </div>
      </div>
    </div>
  );
}

// ─── Bloco 3: Prática Guiada ──────────────────────────────────

function Block3Guided({
  content,
  onComplete,
}: {
  content: LessonContent;
  onComplete: () => void;
}) {
  const [guidedIndex, setGuidedIndex] = useState(0);

  const problems = content.guided;

  const handleProblemComplete = (_correct: boolean, _timeMs: number) => {
    if (guidedIndex < problems.length - 1) {
      setGuidedIndex(i => i + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={guidedIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="w-full"
        >
          <GuidedStepInput
            problem={problems[guidedIndex]}
            problemIndex={guidedIndex}
            totalProblems={problems.length}
            onComplete={handleProblemComplete}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Bloco 4: Consolidação Estrutural ────────────────────────

interface BlockConsolidationProps {
  content: LessonContent;
  recordAttempt: (attempt: ProblemAttempt) => void;
  onComplete: (correctCount: number, times: number[]) => void;
}

function Block4Consolidation({ content, recordAttempt, onComplete }: BlockConsolidationProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const questionStartRef = useRef(Date.now());

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isError, setIsError] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; correctAnswer: number } | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [phase, setPhase] = useState<'answering' | 'summary'>('answering');
  const [summaryMetrics, setSummaryMetrics] = useState<SessionMetrics | null>(null);
  const [summaryCorrect, setSummaryCorrect] = useState(0);

  const questions = content.consolidation;
  const question = questions[index];

  useEffect(() => {
    if (phase === 'answering') {
      questionStartRef.current = Date.now();
      inputRef.current?.focus();
    }
  }, [index, phase]);

  const handleSubmit = () => {
    const num = parseInt(answer);
    if (isNaN(num) || !question || feedback) return;

    const elapsed = Date.now() - questionStartRef.current;
    const isCorrect = num === question.answer;

    recordAttempt({
      problem: {
        id: `b4_${index}`,
        operand1: question.operand1,
        operand2: question.operand2,
        operation: question.operation as Operation,
        correctAnswer: question.answer,
        displayString: getDisplayString(question),
      },
      userAnswer: num,
      isCorrect,
      timeMs: elapsed,
    });

    const newTimes = [...times, elapsed];
    const newCorrect = correctCount + (isCorrect ? 1 : 0);
    setTimes(newTimes);
    setCorrectCount(newCorrect);
    setFeedback({ correct: isCorrect, correctAnswer: question.answer });
    setIsError(!isCorrect);

    setTimeout(() => {
      if (index < questions.length - 1) {
        setIndex(i => i + 1);
        setAnswer('');
        setFeedback(null);
        setIsError(false);
      } else {
        const m = calculateMetrics(newCorrect, questions.length, newTimes);
        setSummaryMetrics(m);
        setSummaryCorrect(newCorrect);
        setPhase('summary');
      }
    }, isCorrect ? 800 : 1500);
  };

  if (phase === 'summary' && summaryMetrics) {
    const status =
      summaryMetrics.precision >= 90 ? 'stable' :
      summaryMetrics.precision >= 70 ? 'consolidating' :
      'unstable';
    const statusColor =
      status === 'stable'   ? 'var(--nm-accent-stability)' :
      status === 'unstable' ? 'var(--nm-accent-error)'     :
      'var(--nm-accent-primary)';
    const statusLabel =
      status === 'stable'   ? 'ESTRUTURA_ESTÁVEL' :
      status === 'unstable' ? 'ESTRUTURA_INSTÁVEL' :
      'CONSOLIDANDO';

    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em]">
              CONSOLIDAÇÃO_CONCLUÍDA
            </div>
          </div>

          <BlueprintCard label="ESTABILIDADE_ESTRUTURAL">
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <div className="text-[10px] font-[family-name:var(--font-data)] uppercase tracking-[0.1em] text-[var(--nm-text-annotation)] mb-1">
                  PRECISÃO
                </div>
                <div className="text-3xl font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums">
                  {summaryMetrics.precision.toFixed(0)}%
                </div>
                <div className="text-xs text-[var(--nm-text-dimmed)] mt-1">
                  {summaryCorrect}/{questions.length} corretas
                </div>
              </div>
              <div>
                <div className="text-[10px] font-[family-name:var(--font-data)] uppercase tracking-[0.1em] text-[var(--nm-text-annotation)] mb-1">
                  TEMPO MÉDIO
                </div>
                <div className="text-3xl font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums">
                  {(summaryMetrics.avgTime / 1000).toFixed(1)}s
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--nm-grid-line)]">
              <div
                className="text-[10px] font-[family-name:var(--font-data)] uppercase tracking-[0.12em]"
                style={{ color: statusColor }}
              >
                {statusLabel}
              </div>
            </div>
          </BlueprintCard>

          <ActionButton variant="primary" className="w-full" onClick={() => onComplete(summaryCorrect, times)}>
            Mini Compressão →
          </ActionButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-1">
            CONSOLIDAÇÃO_ESTRUTURAL
          </div>
          <div className="text-[var(--nm-text-dimmed)] text-xs">
            {index + 1} / {questions.length}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="text-center mb-8"
          >
            <div className="text-5xl font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums mb-2">
              {getDisplayString(question)}
            </div>
            <div className="text-[var(--nm-text-annotation)] text-sm">= ?</div>
          </motion.div>
        </AnimatePresence>

        <div className="mb-4">
          <InputField
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={answer}
            onChange={(e) => setAnswer(e.target.value.replace(/\D/g, ''))}
            onEnter={handleSubmit}
            error={isError}
            placeholder="?"
            className="text-2xl"
            disabled={!!feedback}
          />
        </div>

        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`text-center text-sm font-[family-name:var(--font-data)] ${
                feedback.correct ? 'text-[var(--nm-accent-stability)]' : 'text-[var(--nm-accent-error)]'
              }`}
            >
              {feedback.correct ? 'Correto.' : `Resposta: ${feedback.correctAnswer}`}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center mt-8 text-xs text-[var(--nm-text-annotation)]">
          Pressione Enter para confirmar
        </div>
      </div>
    </div>
  );
}

// ─── Bloco 5: Mini Compressão ─────────────────────────────────

interface BlockCompressionProps {
  content: LessonContent;
  recordAttempt: (attempt: ProblemAttempt) => void;
  onComplete: (correctCount: number, times: number[]) => void;
}

function Block5Compression({ content, recordAttempt, onComplete }: BlockCompressionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const questionStartRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isError, setIsError] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; correctAnswer: number } | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);

  const questions = content.compression;
  const question = questions[index];

  // Timer visual por questão (não bloqueante)
  useEffect(() => {
    questionStartRef.current = Date.now();
    setElapsedMs(0);
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - questionStartRef.current);
    }, 100);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [index]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [index]);

  const handleSubmit = () => {
    const num = parseInt(answer);
    if (isNaN(num) || !question || feedback) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const elapsed = Date.now() - questionStartRef.current;
    const isCorrect = num === question.answer;

    recordAttempt({
      problem: {
        id: `b5_${index}`,
        operand1: question.operand1,
        operand2: question.operand2,
        operation: question.operation as Operation,
        correctAnswer: question.answer,
        displayString: getDisplayString(question),
      },
      userAnswer: num,
      isCorrect,
      timeMs: elapsed,
    });

    const newTimes = [...times, elapsed];
    const newCorrect = correctCount + (isCorrect ? 1 : 0);
    setTimes(newTimes);
    setCorrectCount(newCorrect);
    setFeedback({ correct: isCorrect, correctAnswer: question.answer });
    setIsError(!isCorrect);

    setTimeout(() => {
      if (index < questions.length - 1) {
        setIndex(i => i + 1);
        setAnswer('');
        setFeedback(null);
        setIsError(false);
      } else {
        onComplete(newCorrect, newTimes);
      }
    }, isCorrect ? 800 : 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
      <div className="max-w-sm w-full">
        {/* Header com timer */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-1">
              MINI_COMPRESSÃO
            </div>
            <div className="text-[var(--nm-text-dimmed)] text-xs">
              {index + 1} / {questions.length}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.1em] mb-1">
              TEMPO
            </div>
            <div className="text-[var(--nm-text-high)] font-[family-name:var(--font-data)] text-lg tabular-nums">
              {feedback ? '—' : `${(elapsedMs / 1000).toFixed(1)}s`}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="text-center mb-8"
          >
            <div className="text-5xl font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums mb-2">
              {getDisplayString(question)}
            </div>
            <div className="text-[var(--nm-text-annotation)] text-sm">= ?</div>
          </motion.div>
        </AnimatePresence>

        <div className="mb-4">
          <InputField
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={answer}
            onChange={(e) => setAnswer(e.target.value.replace(/\D/g, ''))}
            onEnter={handleSubmit}
            error={isError}
            placeholder="?"
            className="text-2xl"
            disabled={!!feedback}
          />
        </div>

        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`text-center text-sm font-[family-name:var(--font-data)] ${
                feedback.correct ? 'text-[var(--nm-accent-stability)]' : 'text-[var(--nm-accent-error)]'
              }`}
            >
              {feedback.correct ? 'Correto.' : `Resposta: ${feedback.correctAnswer}`}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center mt-8 text-xs text-[var(--nm-text-annotation)]">
          Pressione Enter para confirmar
        </div>
      </div>
    </div>
  );
}

// ─── Bloco 6: Síntese ─────────────────────────────────────────

interface Block6Props {
  content: LessonContent;
  sessionData: CombinedSessionData;
  onFinish: () => void;
  saving: boolean;
  saveError: string | null;
}

function Block6Synthesis({ content, sessionData, onFinish, saving, saveError }: Block6Props) {
  const { metrics, analysis } = sessionData;

  return (
    <div className="px-6 py-8 pb-16">
      <div className="max-w-md mx-auto space-y-5">
        <div className="text-center">
          <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em]">
            SÍNTESE // ANÁLISE_FINAL
          </div>
        </div>

        {/* Stability Indicator */}
        <BlueprintCard label="DESEMPENHO">
          <StabilityIndicator
            precision={metrics.precision}
            variability={metrics.timeVariability}
            avgTime={metrics.avgTime}
            status={analysis.status}
          />
        </BlueprintCard>

        {/* Technique summary */}
        <BlueprintCard label="TÉCNICA">
          <div className="text-sm font-semibold text-[var(--nm-text-high)] mb-1">
            {content.techniqueName}
          </div>
          <div className="text-xs text-[var(--nm-text-dimmed)] leading-relaxed">
            {content.techniqueRule}
          </div>
        </BlueprintCard>

        {/* Technical message */}
        <BlueprintCard>
          <p className="text-sm text-[var(--nm-text-dimmed)] leading-relaxed">
            {analysis.message}
            {analysis.recommendation && (
              <span className="block mt-1">{analysis.recommendation}</span>
            )}
          </p>
        </BlueprintCard>

        {/* Unstable warning */}
        {analysis.status === 'unstable' && (
          <div className="p-3 rounded-[var(--radius-technical)] border border-[var(--nm-accent-error)] bg-[var(--nm-bg-main)]">
            <div className="text-[10px] font-[family-name:var(--font-data)] uppercase tracking-[0.1em] text-[var(--nm-accent-error)] mb-1">
              REFORÇO_RECOMENDADO
            </div>
            <p className="text-xs text-[var(--nm-text-dimmed)] leading-relaxed">
              Repita esta aula para consolidar o padrão de evocação antes de avançar.
            </p>
          </div>
        )}

        {/* Save error */}
        {saveError && (
          <div className="text-xs text-[var(--nm-accent-error)] text-center">{saveError}</div>
        )}

        {/* Finish button */}
        <ActionButton
          variant="primary"
          className="w-full"
          onClick={onFinish}
          disabled={saving}
        >
          {saving ? 'Salvando...' : 'Finalizar Aula'}
        </ActionButton>
      </div>
    </div>
  );
}

// ─── Treino para Aulas 2 e 3 ─────────────────────────────────

// Wrapper: aguarda recomendação adaptativa antes de renderizar o treino
function LessonTraining({ conceptId, lessonNumber }: { conceptId: number; lessonNumber: number }) {
  const { recommendation, loading: adaptiveLoading } = useAdaptive(conceptId);

  if (adaptiveLoading) {
    return (
      <div className="fixed inset-0 bg-[var(--nm-bg-main)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 size={20} className="text-[var(--nm-text-annotation)] animate-spin mx-auto" />
          <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em]">
            CARREGANDO_CONFIGURAÇÃO...
          </div>
        </div>
      </div>
    );
  }

  // Motor adaptativo: usa o nível/modo recomendado; mantém operação e base do conceito
  const baseConfig = getConfigForLesson(conceptId, lessonNumber);
  const config: TabuadaConfig = recommendation
    ? {
        ...baseConfig,
        mode: recommendation.mode,
        timerMode: recommendation.timer_mode,
      }
    : baseConfig;

  return <LessonTrainingCore config={config} conceptId={conceptId} lessonNumber={lessonNumber} />;
}

function LessonTrainingCore({
  config,
  conceptId,
  lessonNumber,
}: {
  config: TabuadaConfig;
  conceptId: number;
  lessonNumber: number;
}) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const { startSession, recordAttempt, finishSession, saving, saveError } = useSession();

  useEffect(() => {
    startSession(config, conceptId, lessonNumber);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [problems] = useState<Problem[]>(() => generateProblems(config));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [problemStartTime, setProblemStartTime] = useState(Date.now());
  const [correctCount, setCorrectCount] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);

  const currentProblem = problems[currentIndex];
  const totalProblems = problems.length;
  const level = getLevel(config);

  useEffect(() => {
    if (config.timerMode === 'timed' && !sessionComplete) {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - problemStartTime);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [config.timerMode, problemStartTime, sessionComplete]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleComplete = async (finalCorrectCount: number, finalTimes: number[]) => {
    setSessionComplete(true);
    const { metrics, analysis, result } = await finishSession(finalCorrectCount, totalProblems, finalTimes);
    navigate(`/lesson/${conceptId}/${lessonNumber}/result`, {
      state: { metrics, analysis, conceptId, lessonNumber, result },
    });
  };

  const handleSubmit = () => {
    if (!currentProblem || sessionComplete) return;

    const answer = parseInt(userAnswer);
    if (isNaN(answer)) return;

    const correct = currentProblem.correctAnswer;
    const timeTaken = Date.now() - problemStartTime;
    const isCorrect = answer === correct;

    recordAttempt({ problem: currentProblem, userAnswer: answer, isCorrect, timeMs: timeTaken });

    if (isCorrect) {
      const newTimes = [...times, timeTaken];
      const newCorrectCount = correctCount + 1;
      setTimes(newTimes);
      setCorrectCount(newCorrectCount);

      setFeedback(`Execução estável. ${config.timerMode === 'timed' ? (timeTaken / 1000).toFixed(1) + 's' : ''}`);
      setIsError(false);

      setTimeout(async () => {
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
    } else {
      setTimes(prev => [...prev, timeTaken]);
      setFeedback('Desvio de recuperação.');
      setIsError(true);

      setTimeout(() => {
        setIsError(false);
        setUserAnswer('');
        setFeedback(null);
        setProblemStartTime(Date.now());
        setElapsedTime(0);
        inputRef.current?.focus();
      }, 1500);
    }
  };

  const handleExit = () => {
    navigate('/modules');
  };

  if (!currentProblem) return null;

  const operationSymbol = getOperationSymbol(config.operation);
  const operationName = getOperationName(config.operation);
  const lessonLabel = lessonNumber === 2 ? 'COMPRESSÃO' : 'RITMO';

  return (
    <div className="fixed inset-0 bg-[var(--nm-bg-main)] flex items-center justify-center">
      {/* Exit */}
      <button
        onClick={handleExit}
        className="absolute top-6 left-6 text-[var(--nm-text-dimmed)] hover:text-[var(--nm-text-high)] text-sm transition-colors"
      >
        ← Sair
      </button>

      {/* Label */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center">
        <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em]">
          AULA_{lessonLabel} // CONCEPT_{String(conceptId).padStart(2, '0')} // NÍV_{String(level).padStart(2, '0')}
        </div>
        <div className="text-[var(--nm-text-dimmed)] text-xs mt-2">
          {operationName} por {config.base} // Questão {currentIndex + 1}/{totalProblems}
        </div>
      </div>

      {/* Timer */}
      <div className="absolute top-6 right-6">
        {config.timerMode === 'timed' ? (
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

      {/* Saving indicator */}
      {(saving || saveError) && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          {saving && (
            <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em]">
              SALVANDO...
            </div>
          )}
          {saveError && (
            <div className="text-[var(--nm-accent-error)] text-xs">{saveError}</div>
          )}
        </div>
      )}

      {/* Problema */}
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
            <div className="mb-12">
              <div className="text-[64px] md:text-[80px] font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums leading-none mb-4">
                {currentProblem.operand1}
              </div>
              <div className="text-xl md:text-2xl text-[var(--nm-text-dimmed)] font-[family-name:var(--font-data)] mb-2">
                {operationSymbol} {currentProblem.operand2}
              </div>
            </div>

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

            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.25 }}
                  className={`text-sm font-[family-name:var(--font-data)] ${
                    isError ? 'text-[var(--nm-accent-error)]' : 'text-[var(--nm-accent-stability)]'
                  }`}
                >
                  {feedback}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        <div className="text-center mt-12 text-xs text-[var(--nm-text-annotation)]">
          Pressione Enter para confirmar
        </div>
      </div>

      {/* Barra de progresso */}
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

// ─── Fallback para params inválidos ──────────────────────────

function InvalidLesson() {
  return (
    <div className="min-h-screen bg-[var(--nm-bg-main)] flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-[var(--nm-text-annotation)] text-sm mb-4">Aula não encontrada.</div>
        <Link to="/modules" className="text-sm text-[var(--nm-accent-primary)]">
          Voltar aos módulos
        </Link>
      </div>
    </div>
  );
}
