/**
 * Motor Pedagógico da Tabuada
 * Sistema estruturado de automação e estabilidade básica
 */

export type Operation = 'multiplication' | 'division' | 'addition' | 'subtraction';
export type Mode = 'sequential' | 'random';
export type TimerMode = 'timed' | 'untimed';

export interface TabuadaConfig {
  operation: Operation;
  base: number; // Número base (ex: tabuada do 7)
  mode: Mode;
  timerMode: TimerMode;
  range?: { min: number; max: number }; // Para soma/subtração
}

export interface Problem {
  id: string;
  operand1: number;
  operand2: number;
  operation: Operation;
  correctAnswer: number;
  displayString: string;
}

export interface SessionMetrics {
  totalProblems: number;
  correctAnswers: number;
  totalTime: number; // ms
  timePerProblem: number[]; // ms por problema
  errors: number[];
  precision: number; // 0-100%
  avgTime: number; // ms
  timeVariability: number; // desvio padrão
}

/**
 * Gera problemas da tabuada com base na configuração
 */
export function generateProblems(config: TabuadaConfig): Problem[] {
  const { operation, base, mode } = config;
  const problems: Problem[] = [];

  switch (operation) {
    case 'multiplication':
      for (let i = 1; i <= 10; i++) {
        const operand2 = i;
        const answer = base * operand2;
        problems.push({
          id: `mult_${base}_${operand2}`,
          operand1: base,
          operand2,
          operation: 'multiplication',
          correctAnswer: answer,
          displayString: `${base} × ${operand2}`
        });
      }
      break;

    case 'division':
      for (let i = 1; i <= 10; i++) {
        const dividend = base * i;
        const answer = i;
        problems.push({
          id: `div_${dividend}_${base}`,
          operand1: dividend,
          operand2: base,
          operation: 'division',
          correctAnswer: answer,
          displayString: `${dividend} ÷ ${base}`
        });
      }
      break;

    case 'addition':
      for (let i = 1; i <= 10; i++) {
        const operand2 = i;
        const answer = base + operand2;
        problems.push({
          id: `add_${base}_${operand2}`,
          operand1: base,
          operand2,
          operation: 'addition',
          correctAnswer: answer,
          displayString: `${base} + ${operand2}`
        });
      }
      break;

    case 'subtraction':
      for (let i = 1; i <= Math.min(10, base); i++) {
        const operand2 = i;
        const answer = base - operand2;
        if (answer >= 0) {
          problems.push({
            id: `sub_${base}_${operand2}`,
            operand1: base,
            operand2,
            operation: 'subtraction',
            correctAnswer: answer,
            displayString: `${base} − ${operand2}`
          });
        }
      }
      break;
  }

  // Embaralha se modo aleatório
  if (mode === 'random') {
    return shuffleArray([...problems]);
  }

  return problems;
}

/**
 * Embaralha array usando Fisher-Yates
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Calcula métricas da sessão
 */
export function calculateMetrics(
  correctAnswers: number,
  totalProblems: number,
  times: number[]
): SessionMetrics {
  const precision = totalProblems > 0 ? (correctAnswers / totalProblems) * 100 : 0;
  const totalTime = times.reduce((sum, t) => sum + t, 0);
  const avgTime = times.length > 0 ? totalTime / times.length : 0;
  
  // Calcula variabilidade (desvio padrão)
  let variance = 0;
  if (times.length > 1) {
    const squareDiffs = times.map(t => Math.pow(t - avgTime, 2));
    variance = squareDiffs.reduce((sum, sq) => sum + sq, 0) / times.length;
  }
  const timeVariability = Math.sqrt(variance);

  return {
    totalProblems,
    correctAnswers,
    totalTime,
    timePerProblem: times,
    errors: [],
    precision,
    avgTime,
    timeVariability
  };
}

/**
 * Analisa métricas e retorna feedback técnico
 */
export function analyzeFeedback(metrics: SessionMetrics, config: TabuadaConfig): {
  status: 'stable' | 'consolidating' | 'unstable';
  message: string;
  recommendation?: string;
} {
  const { precision, avgTime, timeVariability } = metrics;

  // Alta precisão (>= 90%)
  if (precision >= 90) {
    // Baixa variabilidade
    if (timeVariability < avgTime * 0.3) {
      return {
        status: 'stable',
        message: 'Recuperação direta estabilizada.',
        recommendation: config.timerMode === 'untimed' 
          ? 'Ritmo pode ser introduzido.' 
          : undefined
      };
    } else {
      return {
        status: 'consolidating',
        message: 'Precisão consolidada. Oscilação detectada.',
        recommendation: 'Foco em consistência de evocação.'
      };
    }
  }
  
  // Precisão moderada (70-89%)
  if (precision >= 70) {
    return {
      status: 'consolidating',
      message: 'Recuperação em consolidação.',
      recommendation: 'Reforço estrutural recomendado.'
    };
  }

  // Baixa precisão (< 70%)
  return {
    status: 'unstable',
    message: 'Padrão apresenta interferência.',
    recommendation: 'Retornar ao modo sequencial sem cronômetro.'
  };
}

/**
 * Determina o nível atual baseado na configuração
 */
export function getLevel(config: TabuadaConfig): 1 | 2 | 3 | 4 {
  const { mode, timerMode } = config;
  
  if (mode === 'sequential' && timerMode === 'untimed') return 1;
  if (mode === 'random' && timerMode === 'untimed') return 2;
  if (mode === 'sequential' && timerMode === 'timed') return 3;
  return 4; // random + timed
}

/**
 * Retorna descrição do nível
 */
export function getLevelDescription(level: 1 | 2 | 3 | 4): string {
  const descriptions = {
    1: 'Sequencial sem cronômetro — Construção de padrão linear',
    2: 'Aleatório sem cronômetro — Recuperação sem previsibilidade',
    3: 'Sequencial com cronômetro — Estabilização de ritmo',
    4: 'Aleatório com cronômetro — Automação robusta'
  };
  return descriptions[level];
}

/**
 * Retorna nome da operação em português
 */
export function getOperationName(operation: Operation): string {
  const names = {
    multiplication: 'Multiplicação',
    division: 'Divisão',
    addition: 'Soma',
    subtraction: 'Subtração'
  };
  return names[operation];
}

/**
 * Retorna símbolo da operação
 */
export function getOperationSymbol(operation: Operation): string {
  const symbols = {
    multiplication: '×',
    division: '÷',
    addition: '+',
    subtraction: '−'
  };
  return symbols[operation];
}
