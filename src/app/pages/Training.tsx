import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { InputField } from '../components/InputField';
import { motion, AnimatePresence } from 'motion/react';

export default function Training() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [currentNumber, setCurrentNumber] = useState(47);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [questionCount, setQuestionCount] = useState(1);
  const [totalQuestions] = useState(10);
  const [startTime, setStartTime] = useState(Date.now());

  const problems = [
    { question: 47, operation: '× 5', answer: 235 },
    { question: 83, operation: '× 5', answer: 415 },
    { question: 56, operation: '× 5', answer: 280 },
    { question: 92, operation: '× 5', answer: 460 },
    { question: 34, operation: '× 5', answer: 170 },
    { question: 68, operation: '× 5', answer: 340 },
    { question: 75, operation: '× 5', answer: 375 },
    { question: 41, operation: '× 5', answer: 205 },
    { question: 89, operation: '× 5', answer: 445 },
    { question: 63, operation: '× 5', answer: 315 }
  ];

  const currentProblem = problems[questionCount - 1];

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    const answer = parseInt(userAnswer);
    const correct = currentProblem.answer;

    if (answer === correct) {
      const timeTaken = ((Date.now() - startTime) / 1000).toFixed(1);
      setFeedback(`Execução estável. ${timeTaken}s`);
      setIsError(false);

      // Move to next question after delay
      setTimeout(() => {
        if (questionCount < totalQuestions) {
          setQuestionCount(prev => prev + 1);
          setCurrentNumber(problems[questionCount].question);
          setUserAnswer('');
          setFeedback(null);
          setStartTime(Date.now());
          inputRef.current?.focus();
        } else {
          // Training complete
          navigate('/dashboard');
        }
      }, 1500);
    } else {
      setFeedback('Reforço estrutural recomendado.');
      setIsError(true);
      
      // Clear error state after delay
      setTimeout(() => {
        setIsError(false);
        setUserAnswer('');
        setFeedback(null);
        setStartTime(Date.now());
        inputRef.current?.focus();
      }, 2000);
    }
  };

  const handleExit = () => {
    navigate('/dashboard');
  };

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
          FOUNDATIONAL_01 // 2026
        </div>
        <div className="text-[var(--nm-text-dimmed)] text-xs mt-2">
          Multiplicação por 5 // Questão {questionCount}/{totalQuestions}
        </div>
      </div>

      {/* Stability indicator */}
      <div className="absolute top-6 right-6">
        <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em]">
          STABILITY_INDEX_ACTIVE
        </div>
      </div>

      {/* Main content */}
      <div className="w-full max-w-md px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={questionCount}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className="text-center"
          >
            {/* Question */}
            <div className="mb-12">
              <div className="text-[64px] md:text-[80px] lg:text-[96px] font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums leading-none mb-4">
                {currentNumber}
              </div>
              <div className="text-xl md:text-2xl text-[var(--nm-text-dimmed)] font-[family-name:var(--font-data)]">
                {currentProblem.operation}
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
          animate={{ width: `${(questionCount / totalQuestions) * 100}%` }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </div>
    </div>
  );
}