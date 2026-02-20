import { LessonContent } from '../types/lesson'

// ─── Conteúdo das Aulas — Módulo Foundational (conceitos 1-8) ────────────────
// Fase 2 — Dados estáticos para lessonNumber === 1 (Aula Estrutura)
//
// Mapeamento (Modules.tsx):
//   1 → Multiplicação por 5
//   2 → Soma até 100 com transporte
//   3 → Multiplicação por 9
//   4 → Divisão exata por 2
//   5 → Multiplicação por 2 e 4
//   6 → Adição de três parcelas
//   7 → Subtração com resultado positivo
//   8 → Multiplicação por 10 e 100

const LESSON_CONTENT: LessonContent[] = [

  // ─── Conceito 1 — Multiplicação por 5 ─────────────────────────────────────
  // Técnica: Halvening (×10 depois ÷2)
  {
    conceptId: 1,
    lessonNumber: 1,
    title: 'Multiplicação por 5',
    techniqueName: 'Halvening',
    techniqueRule: 'Multiplique por 10, depois divida por 2',
    warmup: [
      { operand1: 10, operand2: 3,  operation: 'multiplication', answer: 30 },
      { operand1: 20, operand2: 2,  operation: 'division',       answer: 10 },
      { operand1: 10, operand2: 7,  operation: 'multiplication', answer: 70 },
      { operand1: 40, operand2: 2,  operation: 'division',       answer: 20 },
    ],
    technique: {
      example: { operand1: 5, operand2: 14 },
      steps: [
        {
          label: 'Etapa 1',
          expression: '14 × 10',
          explanation: 'Multiplique o segundo número por 10',
          answer: 140,
        },
        {
          label: 'Etapa 2',
          expression: '140 ÷ 2',
          explanation: 'Divida o resultado por 2',
          answer: 70,
        },
      ],
      conclusion: '5 × 14 = 70',
    },
    guided: [
      {
        operand1: 5, operand2: 16, operation: 'multiplication',
        intermediate: { label: '16 × 10 =', answer: 160, errorType: 'decomposition' },
        final: 80,
      },
      {
        operand1: 5, operand2: 18, operation: 'multiplication',
        intermediate: { label: '18 × 10 =', answer: 180, errorType: 'decomposition' },
        final: 90,
      },
      {
        operand1: 5, operand2: 22, operation: 'multiplication',
        intermediate: { label: '22 × 10 =', answer: 220, errorType: 'decomposition' },
        final: 110,
      },
    ],
    consolidation: [
      { operand1: 5, operand2: 6,  operation: 'multiplication', answer: 30  },
      { operand1: 5, operand2: 8,  operation: 'multiplication', answer: 40  },
      { operand1: 5, operand2: 12, operation: 'multiplication', answer: 60  },
      { operand1: 5, operand2: 14, operation: 'multiplication', answer: 70  },
      { operand1: 5, operand2: 16, operation: 'multiplication', answer: 80  },
      { operand1: 5, operand2: 18, operation: 'multiplication', answer: 90  },
      { operand1: 5, operand2: 22, operation: 'multiplication', answer: 110 },
      { operand1: 5, operand2: 24, operation: 'multiplication', answer: 120 },
    ],
    compression: [
      { operand1: 5, operand2: 7,  operation: 'multiplication', answer: 35  },
      { operand1: 5, operand2: 13, operation: 'multiplication', answer: 65  },
      { operand1: 5, operand2: 17, operation: 'multiplication', answer: 85  },
      { operand1: 5, operand2: 19, operation: 'multiplication', answer: 95  },
      { operand1: 5, operand2: 26, operation: 'multiplication', answer: 130 },
    ],
  },

  // ─── Conceito 2 — Soma até 100 com transporte ─────────────────────────────
  // Técnica: Complemento à Dezena (sobe ao múltiplo de 10, soma o resto)
  {
    conceptId: 2,
    lessonNumber: 1,
    title: 'Soma com Transporte',
    techniqueName: 'Complemento à Dezena',
    techniqueRule: 'Suba ao múltiplo de 10 mais próximo, depois some o restante',
    warmup: [
      { operand1: 30, operand2: 40, operation: 'addition', answer: 70 },
      { operand1: 25, operand2: 5,  operation: 'addition', answer: 30 },
      { operand1: 50, operand2: 20, operation: 'addition', answer: 70 },
      { operand1: 45, operand2: 5,  operation: 'addition', answer: 50 },
    ],
    technique: {
      example: { operand1: 47, operand2: 38 },
      steps: [
        {
          label: 'Etapa 1',
          expression: '47 + 3',
          explanation: 'Suba à próxima dezena (50)',
          answer: 50,
        },
        {
          label: 'Etapa 2',
          expression: '38 − 3',
          explanation: 'Reduza a parcela pelo complemento usado',
          answer: 35,
        },
        {
          label: 'Etapa 3',
          expression: '50 + 35',
          explanation: 'Some o valor restante à dezena',
          answer: 85,
        },
      ],
      conclusion: '47 + 38 = 85',
    },
    guided: [
      {
        operand1: 36, operand2: 47, operation: 'addition',
        intermediate: { label: '36 + 4 =', answer: 40, errorType: 'decomposition' },
        final: 83,
      },
      {
        operand1: 58, operand2: 27, operation: 'addition',
        intermediate: { label: '58 + 2 =', answer: 60, errorType: 'decomposition' },
        final: 85,
      },
      {
        operand1: 67, operand2: 24, operation: 'addition',
        intermediate: { label: '67 + 3 =', answer: 70, errorType: 'decomposition' },
        final: 91,
      },
    ],
    consolidation: [
      { operand1: 34, operand2: 56, operation: 'addition', answer: 90 },
      { operand1: 47, operand2: 38, operation: 'addition', answer: 85 },
      { operand1: 65, operand2: 27, operation: 'addition', answer: 92 },
      { operand1: 53, operand2: 39, operation: 'addition', answer: 92 },
      { operand1: 28, operand2: 67, operation: 'addition', answer: 95 },
      { operand1: 44, operand2: 48, operation: 'addition', answer: 92 },
      { operand1: 73, operand2: 18, operation: 'addition', answer: 91 },
      { operand1: 56, operand2: 36, operation: 'addition', answer: 92 },
    ],
    compression: [
      { operand1: 43, operand2: 47, operation: 'addition', answer: 90 },
      { operand1: 58, operand2: 33, operation: 'addition', answer: 91 },
      { operand1: 76, operand2: 17, operation: 'addition', answer: 93 },
      { operand1: 39, operand2: 52, operation: 'addition', answer: 91 },
      { operand1: 64, operand2: 28, operation: 'addition', answer: 92 },
    ],
  },

  // ─── Conceito 3 — Multiplicação por 9 ─────────────────────────────────────
  // Técnica: Complemento ao 10 (n×10 − n)
  {
    conceptId: 3,
    lessonNumber: 1,
    title: 'Multiplicação por 9',
    techniqueName: 'Complemento ao 10',
    techniqueRule: 'Multiplique por 10 e subtraia o número',
    warmup: [
      { operand1: 10, operand2: 6, operation: 'multiplication', answer: 60 },
      { operand1: 10, operand2: 8, operation: 'multiplication', answer: 80 },
      { operand1: 60, operand2: 6, operation: 'subtraction',    answer: 54 },
      { operand1: 80, operand2: 8, operation: 'subtraction',    answer: 72 },
    ],
    technique: {
      example: { operand1: 9, operand2: 7 },
      steps: [
        {
          label: 'Etapa 1',
          expression: '7 × 10',
          explanation: 'Multiplique o segundo número por 10',
          answer: 70,
        },
        {
          label: 'Etapa 2',
          expression: '70 − 7',
          explanation: 'Subtraia o segundo número do resultado',
          answer: 63,
        },
      ],
      conclusion: '9 × 7 = 63',
    },
    guided: [
      {
        operand1: 9, operand2: 8, operation: 'multiplication',
        intermediate: { label: '8 × 10 =', answer: 80, errorType: 'decomposition' },
        final: 72,
      },
      {
        operand1: 9, operand2: 6, operation: 'multiplication',
        intermediate: { label: '6 × 10 =', answer: 60, errorType: 'decomposition' },
        final: 54,
      },
      {
        operand1: 9, operand2: 13, operation: 'multiplication',
        intermediate: { label: '13 × 10 =', answer: 130, errorType: 'decomposition' },
        final: 117,
      },
    ],
    consolidation: [
      { operand1: 9, operand2: 4,  operation: 'multiplication', answer: 36  },
      { operand1: 9, operand2: 5,  operation: 'multiplication', answer: 45  },
      { operand1: 9, operand2: 6,  operation: 'multiplication', answer: 54  },
      { operand1: 9, operand2: 7,  operation: 'multiplication', answer: 63  },
      { operand1: 9, operand2: 8,  operation: 'multiplication', answer: 72  },
      { operand1: 9, operand2: 9,  operation: 'multiplication', answer: 81  },
      { operand1: 9, operand2: 11, operation: 'multiplication', answer: 99  },
      { operand1: 9, operand2: 12, operation: 'multiplication', answer: 108 },
    ],
    compression: [
      { operand1: 9, operand2: 3,  operation: 'multiplication', answer: 27  },
      { operand1: 9, operand2: 14, operation: 'multiplication', answer: 126 },
      { operand1: 9, operand2: 15, operation: 'multiplication', answer: 135 },
      { operand1: 9, operand2: 16, operation: 'multiplication', answer: 144 },
      { operand1: 9, operand2: 17, operation: 'multiplication', answer: 153 },
    ],
  },

  // ─── Conceito 4 — Divisão exata por 2 ─────────────────────────────────────
  // Técnica: Halvening por decomposição (dezenas ÷ 2 + unidades ÷ 2)
  {
    conceptId: 4,
    lessonNumber: 1,
    title: 'Divisão por 2',
    techniqueName: 'Halvening — Decomposição',
    techniqueRule: 'Separe dezenas e unidades, divida cada parte por 2, some os resultados',
    warmup: [
      { operand1: 10, operand2: 2, operation: 'division', answer: 5  },
      { operand1: 20, operand2: 2, operation: 'division', answer: 10 },
      { operand1: 60, operand2: 2, operation: 'division', answer: 30 },
      { operand1: 80, operand2: 2, operation: 'division', answer: 40 },
    ],
    technique: {
      example: { operand1: 84, operand2: 2 },
      steps: [
        {
          label: 'Etapa 1',
          expression: '80 ÷ 2',
          explanation: 'Divida apenas as dezenas por 2',
          answer: 40,
        },
        {
          label: 'Etapa 2',
          expression: '4 ÷ 2',
          explanation: 'Divida as unidades por 2',
          answer: 2,
        },
        {
          label: 'Etapa 3',
          expression: '40 + 2',
          explanation: 'Some as duas partes',
          answer: 42,
        },
      ],
      conclusion: '84 ÷ 2 = 42',
    },
    guided: [
      {
        operand1: 48, operand2: 2, operation: 'division',
        intermediate: { label: '40 ÷ 2 =', answer: 20, errorType: 'decomposition' },
        final: 24,
      },
      {
        operand1: 76, operand2: 2, operation: 'division',
        intermediate: { label: '70 ÷ 2 =', answer: 35, errorType: 'decomposition' },
        final: 38,
      },
      {
        operand1: 68, operand2: 2, operation: 'division',
        intermediate: { label: '60 ÷ 2 =', answer: 30, errorType: 'decomposition' },
        final: 34,
      },
    ],
    consolidation: [
      { operand1: 24, operand2: 2, operation: 'division', answer: 12 },
      { operand1: 36, operand2: 2, operation: 'division', answer: 18 },
      { operand1: 48, operand2: 2, operation: 'division', answer: 24 },
      { operand1: 56, operand2: 2, operation: 'division', answer: 28 },
      { operand1: 68, operand2: 2, operation: 'division', answer: 34 },
      { operand1: 76, operand2: 2, operation: 'division', answer: 38 },
      { operand1: 84, operand2: 2, operation: 'division', answer: 42 },
      { operand1: 96, operand2: 2, operation: 'division', answer: 48 },
    ],
    compression: [
      { operand1: 38, operand2: 2, operation: 'division', answer: 19 },
      { operand1: 54, operand2: 2, operation: 'division', answer: 27 },
      { operand1: 72, operand2: 2, operation: 'division', answer: 36 },
      { operand1: 86, operand2: 2, operation: 'division', answer: 43 },
      { operand1: 94, operand2: 2, operation: 'division', answer: 47 },
    ],
  },

  // ─── Conceito 5 — Multiplicação por 2 e 4 ─────────────────────────────────
  // Técnica: Duplicação (×4 = dobrar duas vezes)
  {
    conceptId: 5,
    lessonNumber: 1,
    title: 'Multiplicação por 2 e 4',
    techniqueName: 'Duplicação',
    techniqueRule: 'Para ×4: duplique o número duas vezes (×2 depois ×2 de novo)',
    warmup: [
      { operand1: 12, operand2: 2, operation: 'multiplication', answer: 24 },
      { operand1: 15, operand2: 2, operation: 'multiplication', answer: 30 },
      { operand1: 24, operand2: 2, operation: 'multiplication', answer: 48 },
      { operand1: 25, operand2: 2, operation: 'multiplication', answer: 50 },
    ],
    technique: {
      example: { operand1: 4, operand2: 13 },
      steps: [
        {
          label: 'Etapa 1',
          expression: '13 × 2',
          explanation: 'Duplique o número uma vez',
          answer: 26,
        },
        {
          label: 'Etapa 2',
          expression: '26 × 2',
          explanation: 'Duplique o resultado novamente',
          answer: 52,
        },
      ],
      conclusion: '4 × 13 = 52',
    },
    guided: [
      {
        operand1: 4, operand2: 15, operation: 'multiplication',
        intermediate: { label: '15 × 2 =', answer: 30, errorType: 'decomposition' },
        final: 60,
      },
      {
        operand1: 4, operand2: 12, operation: 'multiplication',
        intermediate: { label: '12 × 2 =', answer: 24, errorType: 'decomposition' },
        final: 48,
      },
      {
        operand1: 4, operand2: 17, operation: 'multiplication',
        intermediate: { label: '17 × 2 =', answer: 34, errorType: 'decomposition' },
        final: 68,
      },
    ],
    consolidation: [
      { operand1: 2, operand2: 18, operation: 'multiplication', answer: 36  },
      { operand1: 2, operand2: 24, operation: 'multiplication', answer: 48  },
      { operand1: 4, operand2: 11, operation: 'multiplication', answer: 44  },
      { operand1: 4, operand2: 13, operation: 'multiplication', answer: 52  },
      { operand1: 4, operand2: 14, operation: 'multiplication', answer: 56  },
      { operand1: 4, operand2: 16, operation: 'multiplication', answer: 64  },
      { operand1: 4, operand2: 18, operation: 'multiplication', answer: 72  },
      { operand1: 4, operand2: 25, operation: 'multiplication', answer: 100 },
    ],
    compression: [
      { operand1: 4, operand2: 12, operation: 'multiplication', answer: 48 },
      { operand1: 4, operand2: 15, operation: 'multiplication', answer: 60 },
      { operand1: 4, operand2: 17, operation: 'multiplication', answer: 68 },
      { operand1: 4, operand2: 19, operation: 'multiplication', answer: 76 },
      { operand1: 4, operand2: 22, operation: 'multiplication', answer: 88 },
    ],
  },

  // ─── Conceito 6 — Adição de três parcelas ─────────────────────────────────
  // Técnica: Agrupamento por Complemento (encontrar par que soma 10 ou 20)
  {
    conceptId: 6,
    lessonNumber: 1,
    title: 'Adição de Três Parcelas',
    techniqueName: 'Agrupamento por Complemento',
    techniqueRule: 'Identifique dois números que somam 10 ou 20, some-os primeiro',
    warmup: [
      { operand1: 6,  operand2: 4, operation: 'addition', answer: 10 },
      { operand1: 7,  operand2: 3, operation: 'addition', answer: 10 },
      { operand1: 8,  operand2: 2, operation: 'addition', answer: 10 },
      { operand1: 15, operand2: 5, operation: 'addition', answer: 20 },
    ],
    technique: {
      example: { operand1: 7, operand2: 8, operand3: 3 },
      steps: [
        {
          label: 'Etapa 1',
          expression: '7 + 3',
          explanation: 'Identifique o par complementar (soma 10)',
          answer: 10,
        },
        {
          label: 'Etapa 2',
          expression: '10 + 8',
          explanation: 'Some o par ao número restante',
          answer: 18,
        },
      ],
      conclusion: '7 + 8 + 3 = 18',
    },
    guided: [
      {
        operand1: 6, operand2: 9, operand3: 4, operation: 'addition',
        intermediate: { label: '6 + 4 =', answer: 10, errorType: 'decomposition' },
        final: 19,
      },
      {
        operand1: 8, operand2: 5, operand3: 2, operation: 'addition',
        intermediate: { label: '8 + 2 =', answer: 10, errorType: 'decomposition' },
        final: 15,
      },
      {
        operand1: 15, operand2: 7, operand3: 5, operation: 'addition',
        intermediate: { label: '15 + 5 =', answer: 20, errorType: 'decomposition' },
        final: 27,
      },
    ],
    consolidation: [
      { operand1: 4, operand2: 7,  operand3: 6,  operation: 'addition', answer: 17 },
      { operand1: 3, operand2: 8,  operand3: 7,  operation: 'addition', answer: 18 },
      { operand1: 5, operand2: 9,  operand3: 5,  operation: 'addition', answer: 19 },
      { operand1: 6, operand2: 4,  operand3: 8,  operation: 'addition', answer: 18 },
      { operand1: 2, operand2: 7,  operand3: 8,  operation: 'addition', answer: 17 },
      { operand1: 9, operand2: 3,  operand3: 7,  operation: 'addition', answer: 19 },
      { operand1: 5, operand2: 15, operand3: 5,  operation: 'addition', answer: 25 },
      { operand1: 6, operand2: 14, operand3: 6,  operation: 'addition', answer: 26 },
    ],
    compression: [
      { operand1: 7, operand2: 6,  operand3: 4,  operation: 'addition', answer: 17 },
      { operand1: 9, operand2: 8,  operand3: 2,  operation: 'addition', answer: 19 },
      { operand1: 5, operand2: 8,  operand3: 5,  operation: 'addition', answer: 18 },
      { operand1: 4, operand2: 6,  operand3: 16, operation: 'addition', answer: 26 },
      { operand1: 3, operand2: 17, operand3: 7,  operation: 'addition', answer: 27 },
    ],
  },

  // ─── Conceito 7 — Subtração com resultado positivo ────────────────────────
  // Técnica: Contagem para Frente (conta do subtraendo até o minuendo)
  {
    conceptId: 7,
    lessonNumber: 1,
    title: 'Subtração com Resultado Positivo',
    techniqueName: 'Contagem para Frente',
    techniqueRule: 'Conte do menor para o maior: suba à próxima dezena, depois complete até o minuendo',
    warmup: [
      { operand1: 40, operand2: 17, operation: 'subtraction', answer: 23 },
      { operand1: 30, operand2: 8,  operation: 'subtraction', answer: 22 },
      { operand1: 50, operand2: 23, operation: 'subtraction', answer: 27 },
    ],
    technique: {
      example: { operand1: 52, operand2: 37 },
      steps: [
        {
          label: 'Etapa 1',
          expression: '37 + 3',
          explanation: 'Suba à próxima dezena (40)',
          answer: 40,
        },
        {
          label: 'Etapa 2',
          expression: '40 → 52',
          explanation: 'Calcule a distância até o minuendo',
          answer: 12,
        },
        {
          label: 'Etapa 3',
          expression: '3 + 12',
          explanation: 'Some os dois saltos — esse é a diferença',
          answer: 15,
        },
      ],
      conclusion: '52 − 37 = 15',
    },
    guided: [
      {
        operand1: 52, operand2: 37, operation: 'subtraction',
        intermediate: { label: '37 + 3 =', answer: 40, errorType: 'decomposition' },
        final: 15,
      },
      {
        operand1: 64, operand2: 48, operation: 'subtraction',
        intermediate: { label: '48 + 2 =', answer: 50, errorType: 'decomposition' },
        final: 16,
      },
      {
        operand1: 73, operand2: 56, operation: 'subtraction',
        intermediate: { label: '56 + 4 =', answer: 60, errorType: 'decomposition' },
        final: 17,
      },
    ],
    consolidation: [
      { operand1: 40, operand2: 17, operation: 'subtraction', answer: 23 },
      { operand1: 52, operand2: 28, operation: 'subtraction', answer: 24 },
      { operand1: 63, operand2: 37, operation: 'subtraction', answer: 26 },
      { operand1: 71, operand2: 45, operation: 'subtraction', answer: 26 },
      { operand1: 84, operand2: 56, operation: 'subtraction', answer: 28 },
      { operand1: 92, operand2: 67, operation: 'subtraction', answer: 25 },
      { operand1: 55, operand2: 38, operation: 'subtraction', answer: 17 },
      { operand1: 43, operand2: 27, operation: 'subtraction', answer: 16 },
    ],
    compression: [
      { operand1: 48, operand2: 29, operation: 'subtraction', answer: 19 },
      { operand1: 65, operand2: 47, operation: 'subtraction', answer: 18 },
      { operand1: 77, operand2: 58, operation: 'subtraction', answer: 19 },
      { operand1: 83, operand2: 64, operation: 'subtraction', answer: 19 },
      { operand1: 91, operand2: 72, operation: 'subtraction', answer: 19 },
    ],
  },

  // ─── Conceito 8 — Multiplicação por 10 e 100 ──────────────────────────────
  // Técnica: Deslocamento Decimal (adicionar zeros)
  {
    conceptId: 8,
    lessonNumber: 1,
    title: 'Multiplicação por 10 e 100',
    techniqueName: 'Deslocamento Decimal',
    techniqueRule: '×10: adicione um zero. ×100: adicione dois zeros.',
    warmup: [
      { operand1: 5,  operand2: 10, operation: 'multiplication', answer: 50  },
      { operand1: 12, operand2: 10, operation: 'multiplication', answer: 120 },
      { operand1: 3,  operand2: 100, operation: 'multiplication', answer: 300 },
      { operand1: 25, operand2: 10, operation: 'multiplication', answer: 250 },
    ],
    technique: {
      example: { operand1: 47, operand2: 10 },
      steps: [
        {
          label: 'Etapa 1',
          expression: '40 × 10',
          explanation: 'Multiplique as dezenas por 10',
          answer: 400,
        },
        {
          label: 'Etapa 2',
          expression: '7 × 10',
          explanation: 'Multiplique as unidades por 10',
          answer: 70,
        },
        {
          label: 'Etapa 3',
          expression: '400 + 70',
          explanation: 'Some as partes — equivalente a adicionar um zero',
          answer: 470,
        },
      ],
      conclusion: '47 × 10 = 470',
    },
    guided: [
      {
        operand1: 35, operand2: 10, operation: 'multiplication',
        intermediate: { label: '30 × 10 =', answer: 300, errorType: 'decomposition' },
        final: 350,
      },
      {
        operand1: 23, operand2: 100, operation: 'multiplication',
        intermediate: { label: '20 × 100 =', answer: 2000, errorType: 'decomposition' },
        final: 2300,
      },
      {
        operand1: 56, operand2: 10, operation: 'multiplication',
        intermediate: { label: '50 × 10 =', answer: 500, errorType: 'decomposition' },
        final: 560,
      },
    ],
    consolidation: [
      { operand1: 13, operand2: 10,  operation: 'multiplication', answer: 130  },
      { operand1: 24, operand2: 10,  operation: 'multiplication', answer: 240  },
      { operand1: 35, operand2: 10,  operation: 'multiplication', answer: 350  },
      { operand1: 47, operand2: 10,  operation: 'multiplication', answer: 470  },
      { operand1: 8,  operand2: 100, operation: 'multiplication', answer: 800  },
      { operand1: 15, operand2: 100, operation: 'multiplication', answer: 1500 },
      { operand1: 23, operand2: 100, operation: 'multiplication', answer: 2300 },
      { operand1: 56, operand2: 10,  operation: 'multiplication', answer: 560  },
    ],
    compression: [
      { operand1: 19, operand2: 10,  operation: 'multiplication', answer: 190  },
      { operand1: 63, operand2: 10,  operation: 'multiplication', answer: 630  },
      { operand1: 12, operand2: 100, operation: 'multiplication', answer: 1200 },
      { operand1: 78, operand2: 10,  operation: 'multiplication', answer: 780  },
      { operand1: 45, operand2: 100, operation: 'multiplication', answer: 4500 },
    ],
  },
]

// ─── Função de acesso ─────────────────────────────────────────────────────────

export function getLessonContent(
  conceptId: number,
  lessonNumber: number,
): LessonContent | undefined {
  return LESSON_CONTENT.find(
    (c) => c.conceptId === conceptId && c.lessonNumber === lessonNumber,
  )
}

export default LESSON_CONTENT
