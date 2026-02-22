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

// ─── PRO Modes ─────────────────────────────────────────────

export type ProMode = 'flow' | 'rhythm' | 'precision'

export interface ProSessionConfig {
  conceptId: number
  proMode: ProMode
  baseTimeLimit?: number  // ms, para rhythm mode. Default: 5000
}

export interface RhythmProblem extends Problem {
  timeLimit: number  // ms, ajustável dinamicamente
}

/**
 * Ajusta o limite de tempo do Smart Timer (Rhythm Mode).
 * Reduz 100ms a cada 3 acertos consecutivos abaixo do tempo, mínimo 1500ms.
 */
export function adjustTimer(consecutiveCorrectSubTime: number, currentLimit: number): number {
  if (consecutiveCorrectSubTime >= 3) {
    return Math.max(1500, currentLimit - 100)
  }
  return currentLimit
}

/**
 * Gera 10 problemas alternando multiplicação/divisão para o Precision Mode.
 * Índice par = multiplicação, índice ímpar = divisão.
 */
export function generatePrecisionProblems(baseNumber: number): Problem[] {
  return Array.from({ length: 10 }, (_, i) => {
    const isMultiplication = i % 2 === 0
    const operand2 = Math.floor(Math.random() * 9) + 1  // 1–9
    if (isMultiplication) {
      return {
        id: `prec_mult_${baseNumber}_${operand2}_${i}`,
        operand1: baseNumber,
        operand2,
        operation: 'multiplication' as Operation,
        correctAnswer: baseNumber * operand2,
        displayString: `${baseNumber} × ${operand2}`,
      }
    } else {
      const dividend = baseNumber * operand2
      return {
        id: `prec_div_${dividend}_${baseNumber}_${i}`,
        operand1: dividend,
        operand2: baseNumber,
        operation: 'division' as Operation,
        correctAnswer: operand2,
        displayString: `${dividend} ÷ ${baseNumber}`,
      }
    }
  })
}

/**
 * Mapeamento de concept_id para configuração base de treino.
 * Usado no modo guiado (quando ?conceptId está na URL).
 */
export const CONCEPT_CONFIG_MAP: Record<number, {
  name: string;
  operation: Operation;
  base: number;
}> = {
  // Núcleo Fundacional (1-8)
  1:  { name: 'Multiplicação por 5',              operation: 'multiplication', base: 5  },
  2:  { name: 'Soma até 100 com transporte',       operation: 'addition',       base: 10 },
  3:  { name: 'Multiplicação por 9',               operation: 'multiplication', base: 9  },
  4:  { name: 'Divisão exata por 2',               operation: 'division',       base: 2  },
  5:  { name: 'Multiplicação por 2 e 4',           operation: 'multiplication', base: 2  },
  6:  { name: 'Adição de três parcelas',           operation: 'addition',       base: 3  },
  7:  { name: 'Subtração com resultado positivo',  operation: 'subtraction',    base: 10 },
  8:  { name: 'Multiplicação por 10 e 100',        operation: 'multiplication', base: 10 },
  // Consolidação (9-15)
  9:  { name: 'Subtração com empréstimo',          operation: 'subtraction',    base: 10 },
  10: { name: 'Multiplicação por 3 e 6',           operation: 'multiplication', base: 3  },
  11: { name: 'Divisão por 3 e 6',                 operation: 'division',       base: 3  },
  12: { name: 'Multiplicação por 7 e 8',           operation: 'multiplication', base: 7  },
  13: { name: 'Divisão por 4 e 5',                 operation: 'division',       base: 4  },
  14: { name: 'Multiplicação por 11',              operation: 'multiplication', base: 11 },
  15: { name: 'Divisão por 7 e 8',                 operation: 'division',       base: 7  },
  // Automação PRO (16-18)
  16: { name: 'Padrões: Triplos Pitagóricos',      operation: 'multiplication', base: 5  },
  17: { name: 'Padrões: Complementos Decimais',    operation: 'multiplication', base: 7  },
  18: { name: 'Padrões: Sequências Estruturadas',  operation: 'multiplication', base: 9  },
  // Ritmo PRO (19-21)
  19: { name: 'Ritmo: Cadência Base',              operation: 'multiplication', base: 6  },
  20: { name: 'Ritmo: Aceleração Progressiva',     operation: 'multiplication', base: 8  },
  21: { name: 'Ritmo: Pressão Temporal',           operation: 'division',       base: 6  },
  // Precisão PRO (22-24)
  22: { name: 'Precisão: Interferência Básica',    operation: 'multiplication', base: 7  },
  23: { name: 'Precisão: Alternância Controlada',  operation: 'division',       base: 7  },
  24: { name: 'Precisão: Compressão Total',        operation: 'multiplication', base: 9  },
};
