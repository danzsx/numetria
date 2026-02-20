import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { InputField } from '../components/InputField';
import { motion, AnimatePresence } from 'motion/react';
import {
  TabuadaConfig,
  Problem,
  generateProblems,
  getOperationName,
  getOperationSymbol,
  getLevel
} from '../utils/tabuadaEngine';
import { useSession } from '../../hooks/useSession';

export default function TabuadaTraining() {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const config = (location.state as any)?.config as TabuadaConfig | undefined;

  const { startSession, recordAttempt, finishSession, saving, saveError } = useSession();

  useEffect(() => {
    if (!config) {
      navigate('/tabuada/setup');
      return;
    }
    startSession(config);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [problems] = useState<Problem[]>(() =>
    config ? generateProblems(config) : []
  );
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
  const level = config ? getLevel(config) : 1;

  useEffect(() => {
    if (config?.timerMode === 'timed' && !sessionComplete) {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - problemStartTime);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [config?.timerMode, problemStartTime, sessionComplete]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleComplete = async (finalCorrectCount: number, finalTimes: number[]) => {
    setSessionComplete(true);
    const { metrics, analysis } = await finishSession(finalCorrectCount, totalProblems, finalTimes);
    navigate('/tabuada/result', { state: { metrics, analysis, config } });
  };

  const handleSubmit = () => {
    if (!currentProblem || !config || sessionComplete) return;

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

      const timeInSeconds = (timeTaken / 1000).toFixed(1);
      setFeedback(`Execução estável. ${config.timerMode === 'timed' ? timeInSeconds + 's' : ''}`);
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
    navigate('/tabuada/setup');
  };

  if (!config || !currentProblem) {
    return null;
  }

  const operationSymbol = getOperationSymbol(config.operation);
  const operationName = getOperationName(config.operation);

  return (
    <div className="fixed inset-0 bg-[var(--nm-bg-main)] flex items-center justify-center">
      {/* Exit button */}
      <button
        onClick={handleExit}
        className="absolute top-6 left-6 text-[var(--nm-text-dimmed)] hover:text-[var(--nm-text-high)] text-sm transition-colors"
      >
        ← Sair
      </button>

      {/* Top label */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center">
        <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em]">
          TABUADA_NÍVEL_{String(level).padStart(2, '0')} // 2026
        </div>
        <div className="text-[var(--nm-text-dimmed)] text-xs mt-2">
          {operationName} por {config.base} // Questão {currentIndex + 1}/{totalProblems}
        </div>
      </div>

      {/* Timer or Stability indicator */}
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
            {/* Question */}
            <div className="mb-12">
              <div className="text-[64px] md:text-[80px] lg:text-[96px] font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums leading-none mb-4">
                {currentProblem.operand1}
              </div>
              <div className="text-xl md:text-2xl text-[var(--nm-text-dimmed)] font-[family-name:var(--font-data)] mb-2">
                {operationSymbol} {currentProblem.operand2}
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

            {/* Feedback */}
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
          </motion.div>
        </AnimatePresence>

        {/* Instructions */}
        <div className="text-center mt-12 text-xs text-[var(--nm-text-annotation)]">
          Pressione Enter para confirmar
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
