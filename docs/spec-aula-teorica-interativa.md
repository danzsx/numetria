# Spec — Aula Teórica Interativa

**Gerado em:** 2026-02-22
**Baseado em:** `docs/PRD-aula-teorica-interativa.md`
**Status:** Pronto para implementação

---

## Contexto do código existente

| Item | Local | Observação |
|---|---|---|
| Orquestrador da Aula 1 | `LessonExecution.tsx` → `LessonTypeStructure` | `currentBlock: 1\|2\|3\|4\|5\|6` |
| Block 2 atual (a substituir) | `StepBlock.tsx` | renderizado em `currentBlock === 2` |
| Prática guiada | `GuidedStepInput.tsx` | reutilizável em T4/T5 |
| Tipos de aula | `src/types/lesson.ts` | `LessonContent` — adicionar `theory?` |
| Dados estáticos | `src/data/lessonContent.ts` | adicionar `theoryContent.ts` ao lado |
| Progresso atual | `blockProgress: { 1:17, 2:33, 3:50, 4:67, 5:83, 6:100 }` | reorganizar após integração |
| Sessão | `useSession.ts` | adicionar `theoryCompleted`, `calibrationStatus` |
| Componentes compartilhados | `InputField`, `BlueprintCard`, `ActionButton` | reutilizar sem modificação |

---

## Fase 0 — Infraestrutura de tipos e dados

### Arquivos a criar / modificar

#### `src/types/lesson.ts` — Adicionar `TheoryContent`

```typescript
// Adicionar após as interfaces existentes (linha 57)

export interface TheoryStep {
  prompt: string
  answer: number
}

export interface TheoryContent {
  conceptId: number

  hook: {
    problem: { operand1: number; operand2: number; operation: string }
    answer: number
    visualHint: string
  }

  intuition: {
    lines: string[]
    keyEquation: string
    comprehensionQuestion: {
      question: string
      options: string[]
      correctIndex: number
      explanation: string
    }
  }

  strategy: {
    innerVoice: string[]
    gapInputs: TheoryStep[]
  }

  guidedExample: {
    operand1: number
    operand2: number
    steps: TheoryStep[]
    compactThought: string
  }

  simulatedPractice: {
    operand1: number
    operand2: number
    steps: TheoryStep[]
    successMessage: string
  }

  commonError: {
    wrongProblem: { operand1: number; operand2: number; wrongAnswer: number }
    errorStep: string
    errorExplanation: string
    cognitiveAnchor: string
  }

  calibration: {
    operand1: number
    operand2: number
    answer: number
    steps: TheoryStep[]
  }
}

// Estender LessonContent com campo opcional
// (modificar a interface existente LessonContent — linha 41)
// Adicionar como último campo:
//   theory?: TheoryContent
```

**Modificação em `LessonContent` (linha ~56 de `lesson.ts`):**

```typescript
export interface LessonContent {
  conceptId: number
  lessonNumber: 1 | 2 | 3
  title: string
  techniqueName: string
  techniqueRule: string
  warmup: WarmupQuestion[]
  technique: {
    example: { operand1: number; operand2: number; operand3?: number }
    steps: TechniqueStep[]
    conclusion: string
  }
  guided: GuidedProblem[]
  consolidation: ConsolidationQuestion[]
  compression: ConsolidationQuestion[]
  theory?: TheoryContent  // ← NOVO: undefined = fallback para StepBlock
}
```

---

#### `src/data/theoryContent.ts` — Arquivo novo

```typescript
import { TheoryContent } from '../types/lesson'

export const THEORY_CONTENT: TheoryContent[] = [
  // Conceito 1 — Multiplicação por 5
  {
    conceptId: 1,
    hook: {
      problem: { operand1: 5, operand2: 28, operation: 'multiplication' },
      answer: 140,
      visualHint: 'número 28 se divide em ×10 e ÷2',
    },
    intuition: {
      lines: [
        'Multiplicar por 5 repete a soma 5 vezes.',
        'Mas 5 = 10 ÷ 2.',
        'Então multiplicar por 5 é multiplicar por 10 e pegar a metade.',
      ],
      keyEquation: 'n × 5 = (n × 10) ÷ 2',
      comprehensionQuestion: {
        question: 'Por que dividimos por 2 depois de multiplicar por 10?',
        options: ['Porque 5 é metade de 10', 'Para diminuir o erro', 'Porque o resultado seria muito grande'],
        correctIndex: 0,
        explanation: '5 é exatamente a metade de 10. Então ×10 e depois ÷2 é o mesmo que ×5.',
      },
    },
    strategy: {
      innerVoice: ['14 vezes 5…', '14 vezes 10 dá ___', 'metade de ___ é ___'],
      gapInputs: [
        { prompt: '14 × 10 =', answer: 140 },
        { prompt: 'Metade de 140 =', answer: 70 },
      ],
    },
    guidedExample: {
      operand1: 5, operand2: 28,
      steps: [
        { prompt: '28 × 10 =', answer: 280 },
        { prompt: 'Metade de 280 =', answer: 140 },
      ],
      compactThought: '"28 vira 280… metade é 140."',
    },
    simulatedPractice: {
      operand1: 5, operand2: 36,
      steps: [
        { prompt: '36 × 10 =', answer: 360 },
        { prompt: 'Metade de 360 =', answer: 180 },
      ],
      successMessage: 'Estrutura executada. Dois passos, resultado correto.',
    },
    commonError: {
      wrongProblem: { operand1: 5, operand2: 18, wrongAnswer: 180 },
      errorStep: 'Multiplicou por 10 (✓) mas esqueceu de dividir por 2 (✗)',
      errorExplanation: 'O cérebro parou na primeira etapa automática. O resultado correto é 90.',
      cognitiveAnchor: '"Já tirei a metade?"',
    },
    calibration: {
      operand1: 5, operand2: 248, answer: 1240,
      steps: [
        { prompt: '248 × 10 =', answer: 2480 },
        { prompt: 'Metade de 2480 =', answer: 1240 },
      ],
    },
  },

  // Conceito 2 — Soma até 100 com transporte
  {
    conceptId: 2,
    hook: {
      problem: { operand1: 48, operand2: 37, operation: 'addition' },
      answer: 85,
      visualHint: 'unidades 8+7 passam de 9 — uma dezena sobe',
    },
    intuition: {
      lines: [
        'Quando somamos unidades e passamos de 9, formamos uma dezena nova.',
        '8 + 7 = 15. Ficam 5 unidades. Sobe 1 dezena.',
        'O cérebro fecha blocos completos de 10 — isso reduz esforço mental.',
      ],
      keyEquation: 'Unidades ≥ 10 → 1 dezena sobe',
      comprehensionQuestion: {
        question: 'O que acontece quando a soma das unidades passa de 9?',
        options: ['Formamos uma nova dezena e subimos 1', 'Descartamos o excesso', 'Somamos direto nas dezenas'],
        correctIndex: 0,
        explanation: '10 unidades = 1 dezena. Quando passa de 9, separamos: ficam as unidades, e 1 dezena sobe.',
      },
    },
    strategy: {
      innerVoice: ['8 mais 7 dá 15…', 'fico com ___ unidades…', 'sobe 1… agora 4 + 3 + 1 = ___'],
      gapInputs: [
        { prompt: '8 + 7 = (fico com unidades)', answer: 5 },
        { prompt: '4 + 3 + 1 (dezenas + transporte) =', answer: 8 },
      ],
    },
    guidedExample: {
      operand1: 48, operand2: 37,
      steps: [
        { prompt: 'Unidades: 8 + 7 =', answer: 15 },
        { prompt: 'Ficam de unidades:', answer: 5 },
        { prompt: 'Dezenas: 4 + 3 + 1 =', answer: 8 },
      ],
      compactThought: '"8 + 7 = 15… fico com 5… sobe 1… 4+3+1=8… resultado: 85"',
    },
    simulatedPractice: {
      operand1: 56, operand2: 29,
      steps: [
        { prompt: 'Unidades: 6 + 9 =', answer: 15 },
        { prompt: 'Ficam de unidades:', answer: 5 },
        { prompt: 'Dezenas: 5 + 2 + 1 =', answer: 8 },
      ],
      successMessage: 'Transporte executado. Estrutura correta.',
    },
    commonError: {
      wrongProblem: { operand1: 48, operand2: 37, wrongAnswer: 75 },
      errorStep: 'Somou 4 + 3 = 7 nas dezenas (✗) — esqueceu o transporte (✗)',
      errorExplanation: 'As unidades deram 15: fica 5 e sobe 1. As dezenas são 4 + 3 + 1 = 8. Resultado: 85.',
      cognitiveAnchor: '"Subiu alguma dezena?"',
    },
    calibration: {
      operand1: 86, operand2: 57, answer: 143,
      steps: [
        { prompt: 'Unidades: 6 + 7 =', answer: 13 },
        { prompt: 'Ficam de unidades:', answer: 3 },
        { prompt: 'Dezenas: 8 + 5 + 1 =', answer: 14 },
      ],
    },
  },

  // Conceito 3 — Multiplicação por 9
  {
    conceptId: 3,
    hook: {
      problem: { operand1: 9, operand2: 23, operation: 'multiplication' },
      answer: 207,
      visualHint: '23 → ×10 → −23',
    },
    intuition: {
      lines: [
        'Multiplicar por 9 diretamente é trabalhoso.',
        'Mas 9 = 10 − 1.',
        'Então n × 9 = (n × 10) − n. Troca uma operação pesada por duas simples.',
      ],
      keyEquation: 'n × 9 = (n × 10) − n',
      comprehensionQuestion: {
        question: 'Por que subtraímos o número original depois de multiplicar por 10?',
        options: ['Porque 9 = 10 − 1, então ×9 = ×10 e depois −1×', 'Para compensar o arredondamento', 'Para facilitar a divisão'],
        correctIndex: 0,
        explanation: '9 é 10 menos 1. Então n×9 é n×10 menos n×1, ou seja, menos o próprio n.',
      },
    },
    strategy: {
      innerVoice: ['23 vezes 9…', '23 vezes 10 dá ___', 'agora tiro 23: ___ − 23 = ___'],
      gapInputs: [
        { prompt: '23 × 10 =', answer: 230 },
        { prompt: '230 − 23 =', answer: 207 },
      ],
    },
    guidedExample: {
      operand1: 9, operand2: 23,
      steps: [
        { prompt: '23 × 10 =', answer: 230 },
        { prompt: '230 − 20 =', answer: 210 },
        { prompt: '210 − 3 =', answer: 207 },
      ],
      compactThought: '"23 vira 230… tiro 23 em partes: −20=210, −3=207"',
    },
    simulatedPractice: {
      operand1: 9, operand2: 47,
      steps: [
        { prompt: '47 × 10 =', answer: 470 },
        { prompt: '470 − 40 =', answer: 430 },
        { prompt: '430 − 7 =', answer: 423 },
      ],
      successMessage: 'Compensação executada. Estrutura reconhecida.',
    },
    commonError: {
      wrongProblem: { operand1: 9, operand2: 35, wrongAnswer: 350 },
      errorStep: 'Multiplicou 35 × 10 = 350 e esqueceu de subtrair 35 (✗)',
      errorExplanation: '35 × 10 = 350. Falta subtrair 35: 350 − 35 = 315. Decompor: 350 − 30 = 320, 320 − 5 = 315.',
      cognitiveAnchor: '"Separei dezenas e unidades ao subtrair?"',
    },
    calibration: {
      operand1: 9, operand2: 256, answer: 2304,
      steps: [
        { prompt: '256 × 10 =', answer: 2560 },
        { prompt: '2560 − 200 =', answer: 2360 },
        { prompt: '2360 − 50 =', answer: 2310 },
        { prompt: '2310 − 6 =', answer: 2304 },
      ],
    },
  },

  // Conceito 4 — Divisão exata por 2
  {
    conceptId: 4,
    hook: {
      problem: { operand1: 84, operand2: 2, operation: 'division' },
      answer: 42,
      visualHint: '84 se divide em 80 e 4 → cada metade',
    },
    intuition: {
      lines: [
        'Dividir por 2 é encontrar a metade.',
        'O cérebro reconhece paridade com facilidade.',
        'Separamos o número em dezenas e unidades e tiramos a metade de cada parte.',
      ],
      keyEquation: 'a÷2 + b÷2 = (a+b)÷2',
      comprehensionQuestion: {
        question: 'Por que decompor o número antes de dividir por 2?',
        options: ['Para tirar a metade de cada parte separadamente, o que é mais simples', 'Para evitar números decimais', 'Porque a divisão não funciona em números maiores'],
        correctIndex: 0,
        explanation: 'Metade de 80 e metade de 4 são operações triviais. Some os resultados: 40 + 2 = 42.',
      },
    },
    strategy: {
      innerVoice: ['84 dividido por 2…', 'metade de 80 é ___', 'metade de 4 é ___', 'resultado: ___'],
      gapInputs: [
        { prompt: 'Metade de 80 =', answer: 40 },
        { prompt: 'Metade de 4 =', answer: 2 },
      ],
    },
    guidedExample: {
      operand1: 84, operand2: 2,
      steps: [
        { prompt: '80 ÷ 2 =', answer: 40 },
        { prompt: '4 ÷ 2 =', answer: 2 },
      ],
      compactThought: '"80 vira 40, 4 vira 2, resultado 42."',
    },
    simulatedPractice: {
      operand1: 96, operand2: 2,
      steps: [
        { prompt: '90 ÷ 2 =', answer: 45 },
        { prompt: '6 ÷ 2 =', answer: 3 },
      ],
      successMessage: 'Decomposição executada. Estrutura correta.',
    },
    commonError: {
      wrongProblem: { operand1: 128, operand2: 2, wrongAnswer: 54 },
      errorStep: 'Dividiu apenas 100 ÷ 2 = 50 e esqueceu as demais partes (✗)',
      errorExplanation: '128 = 100 + 20 + 8. Metade de 100 = 50, metade de 20 = 10, metade de 8 = 4. Total: 64.',
      cognitiveAnchor: '"Decompus completamente antes de dividir?"',
    },
    calibration: {
      operand1: 1256, operand2: 2, answer: 628,
      steps: [
        { prompt: '1200 ÷ 2 =', answer: 600 },
        { prompt: '56 ÷ 2 =', answer: 28 },
      ],
    },
  },

  // Conceito 5 — Multiplicação por 2 e 4
  {
    conceptId: 5,
    hook: {
      problem: { operand1: 4, operand2: 27, operation: 'multiplication' },
      answer: 108,
      visualHint: '27 → dobro → dobro novamente',
    },
    intuition: {
      lines: [
        'Multiplicar por 2 é dobrar.',
        '4 = 2 × 2. Então multiplicar por 4 é dobrar duas vezes.',
        'Dobrar é uma das operações mais estáveis mentalmente.',
      ],
      keyEquation: 'n × 4 = dobro(dobro(n))',
      comprehensionQuestion: {
        question: 'Para multiplicar por 4, dobro quantas vezes?',
        options: ['Duas vezes', 'Uma vez', 'Quatro vezes'],
        correctIndex: 0,
        explanation: '4 = 2 × 2. Então ×4 é dobrar e depois dobrar de novo.',
      },
    },
    strategy: {
      innerVoice: ['18 vezes 4…', 'dobro de 18 é ___', 'dobro de ___ é ___'],
      gapInputs: [
        { prompt: 'Dobro de 18 =', answer: 36 },
        { prompt: 'Dobro de 36 =', answer: 72 },
      ],
    },
    guidedExample: {
      operand1: 4, operand2: 18,
      steps: [
        { prompt: 'Dobro de 18 =', answer: 36 },
        { prompt: 'Dobro de 36 =', answer: 72 },
      ],
      compactThought: '"18 → 36 → 72. Dois dobros."',
    },
    simulatedPractice: {
      operand1: 4, operand2: 27,
      steps: [
        { prompt: 'Dobro de 27 =', answer: 54 },
        { prompt: 'Dobro de 54 =', answer: 108 },
      ],
      successMessage: 'Dois dobros executados. Estrutura reconhecida.',
    },
    commonError: {
      wrongProblem: { operand1: 4, operand2: 23, wrongAnswer: 46 },
      errorStep: 'Dobrou apenas uma vez (23 × 2 = 46) em vez de duas (✗)',
      errorExplanation: 'Para ×4 são dois dobros: 23→46→92. O erro é parar no primeiro dobro.',
      cognitiveAnchor: '"Dobrei duas vezes?"',
    },
    calibration: {
      operand1: 4, operand2: 248, answer: 992,
      steps: [
        { prompt: 'Dobro de 248 =', answer: 496 },
        { prompt: 'Dobro de 496 =', answer: 992 },
      ],
    },
  },

  // Conceito 6 — Adição de três parcelas
  {
    conceptId: 6,
    hook: {
      problem: { operand1: 27, operand2: 38, operation: 'addition' },
      answer: 78,
      visualHint: '27 e 13 se agrupam em 40 antes de somar 38',
    },
    intuition: {
      lines: [
        'Somar na ordem dada nem sempre é o caminho mais curto.',
        'O cérebro prefere fechar dezenas cheias.',
        'Identificar dois números que somam múltiplo de 10 reduz o esforço.',
      ],
      keyEquation: 'a + b + c → (par que fecha 10) + restante',
      comprehensionQuestion: {
        question: 'Por que reagrupar os números antes de somar os três?',
        options: ['Para criar uma dezena cheia e facilitar a soma final', 'Porque a ordem dos números importa para o resultado', 'Para evitar o transporte'],
        correctIndex: 0,
        explanation: 'Fechando 27 + 13 = 40 primeiro, somamos 40 + 38 = 78. Muito mais simples que 27 + 38 = 65, depois 65 + 13.',
      },
    },
    strategy: {
      innerVoice: ['27 + 38 + 13…', 'vejo que ___ + ___ fecha 40…', '40 + 38 = ___'],
      gapInputs: [
        { prompt: '27 + 13 (par que fecha dezena) =', answer: 40 },
        { prompt: '40 + 38 =', answer: 78 },
      ],
    },
    guidedExample: {
      operand1: 27, operand2: 38,
      steps: [
        { prompt: '27 + 13 (fechando dezena) =', answer: 40 },
        { prompt: '40 + 38 =', answer: 78 },
      ],
      compactThought: '"27 e 13 fecham 40. 40 + 38 = 78."',
    },
    simulatedPractice: {
      operand1: 46, operand2: 19,
      steps: [
        { prompt: '46 + 14 (fechando dezena) =', answer: 60 },
        { prompt: '60 + 19 =', answer: 79 },
      ],
      successMessage: 'Reagrupamento executado. Dezena fechada com precisão.',
    },
    commonError: {
      wrongProblem: { operand1: 36, operand2: 24, wrongAnswer: 75 },
      errorStep: 'Somou direto na ordem sem identificar o par ideal (✗)',
      errorExplanation: 'Em 36+24+15: o par ideal é 36+24=60 (fecha dezena). Depois 60+15=75. Sempre procure o par.',
      cognitiveAnchor: '"Identifiquei o par que fecha a dezena?"',
    },
    calibration: {
      operand1: 68, operand2: 27, answer: 127,
      steps: [
        { prompt: '68 + 32 (par que fecha centena) =', answer: 100 },
        { prompt: '100 + 27 =', answer: 127 },
      ],
    },
  },

  // Conceito 7 — Subtração com resultado positivo
  {
    conceptId: 7,
    hook: {
      problem: { operand1: 74, operand2: 38, operation: 'subtraction' },
      answer: 36,
      visualHint: '74 − 30 → depois − 8',
    },
    intuition: {
      lines: [
        'Subtrair um número inteiro de uma vez pode ser confuso.',
        'O cérebro trabalha melhor em etapas: subtrair dezenas, depois unidades.',
        'É a estratégia de compensação: desmontar o subtraendo.',
      ],
      keyEquation: 'a − bc = (a − b0) − c',
      comprehensionQuestion: {
        question: 'Por que subtraímos as dezenas primeiro?',
        options: ['Porque é mais simples subtrair em partes do que tudo de uma vez', 'Para manter o resultado positivo', 'Porque as unidades precisam do resultado das dezenas'],
        correctIndex: 0,
        explanation: '74 − 30 = 44 é direto. Depois 44 − 8 = 36. Dois passos simples versus uma subtração complexa.',
      },
    },
    strategy: {
      innerVoice: ['74 menos 38…', '74 menos 30 é ___', '___ menos 8 é ___'],
      gapInputs: [
        { prompt: '74 − 30 =', answer: 44 },
        { prompt: '44 − 8 =', answer: 36 },
      ],
    },
    guidedExample: {
      operand1: 74, operand2: 38,
      steps: [
        { prompt: '74 − 30 =', answer: 44 },
        { prompt: '44 − 8 =', answer: 36 },
      ],
      compactThought: '"74 menos 30 = 44. 44 menos 8 = 36."',
    },
    simulatedPractice: {
      operand1: 92, operand2: 47,
      steps: [
        { prompt: '92 − 40 =', answer: 52 },
        { prompt: '52 − 7 =', answer: 45 },
      ],
      successMessage: 'Decomposição do subtraendo executada corretamente.',
    },
    commonError: {
      wrongProblem: { operand1: 85, operand2: 34, wrongAnswer: 41 },
      errorStep: 'Confundiu dezena com unidade ao subtrair a segunda parte (✗)',
      errorExplanation: '85 − 34: subtrai dezenas primeiro (85−30=55), depois unidades (55−4=51). Resultado correto: 51.',
      cognitiveAnchor: '"Decompus o subtraendo em dezenas e unidades?"',
    },
    calibration: {
      operand1: 203, operand2: 87, answer: 116,
      steps: [
        { prompt: '203 − 80 =', answer: 123 },
        { prompt: '123 − 7 =', answer: 116 },
      ],
    },
  },

  // Conceito 8 — Multiplicação por 10 e 100
  {
    conceptId: 8,
    hook: {
      problem: { operand1: 248, operand2: 100, operation: 'multiplication' },
      answer: 24800,
      visualHint: '248 → dois zeros adicionados → 24800',
    },
    intuition: {
      lines: [
        'Multiplicar por 10 desloca o valor uma casa decimal para a esquerda.',
        'Multiplicar por 100 desloca duas casas.',
        'Acrescentar zeros é a representação visual desse deslocamento.',
      ],
      keyEquation: 'n × 10^k = n seguido de k zeros',
      comprehensionQuestion: {
        question: 'O que significa multiplicar por 10 em termos de posição decimal?',
        options: ['Desloca todos os algarismos uma posição à esquerda', 'Duplica o valor de cada dígito', 'Adiciona 10 ao número'],
        correctIndex: 0,
        explanation: 'Cada posição à esquerda multiplica por 10. Por isso ×10 desloca uma posição — equivalente a acrescentar um zero.',
      },
    },
    strategy: {
      innerVoice: ['36 vezes 100…', 'são duas casas à esquerda…', 'resultado: ___'],
      gapInputs: [
        { prompt: '36 × 10 =', answer: 360 },
        { prompt: '36 × 100 =', answer: 3600 },
      ],
    },
    guidedExample: {
      operand1: 36, operand2: 100,
      steps: [
        { prompt: '36 × 10 =', answer: 360 },
        { prompt: '360 × 10 = (ou 36 × 100) =', answer: 3600 },
      ],
      compactThought: '"36 → acrescento dois zeros → 3600."',
    },
    simulatedPractice: {
      operand1: 47, operand2: 100,
      steps: [
        { prompt: '47 × 100 =', answer: 4700 },
      ],
      successMessage: 'Deslocamento posicional executado. Estrutura reconhecida.',
    },
    commonError: {
      wrongProblem: { operand1: 75, operand2: 100, wrongAnswer: 750 },
      errorStep: 'Acrescentou apenas um zero (×10) em vez de dois (×100) (✗)',
      errorExplanation: '×100 = dois zeros. 75 × 100 = 7500. Confundir ×10 com ×100 é o erro mais frequente.',
      cognitiveAnchor: '"Contei o número correto de zeros?"',
    },
    calibration: {
      operand1: 248, operand2: 100, answer: 24800,
      steps: [
        { prompt: '248 × 100 =', answer: 24800 },
      ],
    },
  },
]

export function getTheoryContent(conceptId: number): TheoryContent | null {
  return THEORY_CONTENT.find(t => t.conceptId === conceptId) ?? null
}
```

**Critério de conclusão da Fase 0:**
- `getTheoryContent(1)` retorna objeto com 7 sub-campos populados
- Nenhuma resposta em `gapInputs`, `steps` ou `calibration.steps` é `NaN` ou `0`
- `LessonContent` aceita `theory?` sem erro de tipagem

---

## Fase 1 — Componentes de UI

### Localização dos arquivos

Todos os componentes novos em: `src/app/components/theory/`

```
src/app/components/theory/
  TheoryPhase.tsx          ← orquestrador (T1→T7)
  TheoryHook.tsx           ← T1
  TheoryIntuition.tsx      ← T2
  TheoryStrategy.tsx       ← T3
  TheoryGuidedExample.tsx  ← T4
  TheorySimulated.tsx      ← T5
  TheoryCommonError.tsx    ← T6
  TheoryCalibration.tsx    ← T7
```

---

### `TheoryPhase.tsx` — Orquestrador

```typescript
type TheorySubStep = 'T1_hook' | 'T2_intuition' | 'T3_strategy' |
                     'T4_guided' | 'T5_simulated' | 'T6_errors' | 'T7_calibration'

interface TheoryPhaseProps {
  content: TheoryContent
  onComplete: (calibrationStatus: 'ok' | 'assisted') => void
}
```

Gerencia `currentStep: TheorySubStep`, renderiza o sub-componente com `AnimatePresence` usando a transição padrão do projeto:

```typescript
// Transição padrão — consistente com LessonExecution.tsx
initial={{ opacity: 0, y: 16 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -16 }}
transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
```

---

### `TheoryHook.tsx` — T1 (Gancho Cognitivo)

**Props:** `hook: TheoryContent['hook']`, `onComplete: () => void`

**Estados internos:**
```typescript
type Phase = 'initial' | 'answered_correct' | 'answered_wrong' | 'skipped' | 'hint_visible'
const [phase, setPhase] = useState<Phase>('initial')
const [userAnswer, setUserAnswer] = useState('')
```

**Fluxo de render:**
1. Exibe o problema (`hook.problem.operand1 OP operand2 = ?`)
2. Dois botões: `"Eu sei calcular"` / `"Não sei ao certo"`
3. Se "Eu sei": `<InputField>` numérico → valida contra `hook.answer`
4. Feedback diferenciado (correto/incorreto), mensagem do `visualHint`
5. Botão `"Ver como funciona →"` → chama `onComplete()`

**Nota:** Não usa `BlueprintCard` nesta tela — layout centralizado simples, problema em `text-5xl font-data`.

---

### `TheoryIntuition.tsx` — T2 (Por que funciona?)

**Props:** `intuition: TheoryContent['intuition']`, `onComplete: () => void`

**Estados internos:**
```typescript
const [visibleLines, setVisibleLines] = useState(0)
const [questionAnswered, setQuestionAnswered] = useState(false)
const [selectedOption, setSelectedOption] = useState<number | null>(null)
const [attempts, setAttempts] = useState(0)
```

**Fluxo:**
1. Linhas de `intuition.lines` reveladas uma por vez (tap ou 900ms auto)
2. Linha ativa: `text-[var(--nm-text-high)]`; linhas anteriores: `text-[var(--nm-text-dimmed)]`
3. Após última linha: exibir `intuition.keyEquation` em `BlueprintCard` com destaque
4. Múltipla escolha de compreensão — `intuition.comprehensionQuestion`
5. Correto na 1.ª tentativa: feedback positivo → `onComplete()`
6. Incorreto: exibe `explanation`, avança na 2.ª tentativa automaticamente
7. Botão `"Entendido →"` aparece após questão respondida

---

### `TheoryStrategy.tsx` — T3 (Estratégia Mental)

**Props:** `strategy: TheoryContent['strategy']`, `onComplete: () => void`

**Estados internos:**
```typescript
const [voiceIndex, setVoiceIndex] = useState(0)    // frase atual do innerVoice
const [inputIndex, setInputIndex] = useState(0)     // qual gapInput está ativo
const [answers, setAnswers] = useState<(number|null)[]>([])
const [currentAnswer, setCurrentAnswer] = useState('')
const [errorCount, setErrorCount] = useState(0)    // erros no input atual
```

**Fluxo:**
- Frases de `strategy.innerVoice` em typewriter (palavra por palavra, 80ms/palavra)
- Quando uma frase contém `___`, substitui pelo `<InputField>` correspondente de `gapInputs`
- Acerto: input vira texto estático em `var(--nm-accent-stability)`; próximo input ativa
- Erro: animação `x: [-4, 4, -4, 0]` (vibração). Após 2 erros: preenche automaticamente e avança
- Síntese final exibida em `BlueprintCard` com conexão visual dos passos
- Botão `"Ver exemplo completo →"` → `onComplete()`

---

### `TheoryGuidedExample.tsx` — T4 (Exemplo Guiado)

**Props:** `guidedExample: TheoryContent['guidedExample']`, `onComplete: () => void`

**Reutiliza:** Lógica de inputs sequenciais semelhante ao `GuidedStepInput.tsx`

**Estados internos:**
```typescript
const [stepIndex, setStepIndex] = useState(-1)   // -1 = nenhum step revelado
const [answers, setAnswers] = useState<(string)[]>([])
const [errorCounts, setErrorCounts] = useState<number[]>([])
```

**Fluxo:**
1. Problema em destaque: `guidedExample.operand1 OP operand2`
2. Botão `"Revelar Etapa 1 →"` (tap do usuário para iniciar)
3. Cada etapa revelada: label + `<InputField>` ativo
4. Acerto: input congela em verde; próxima etapa disponível via tap
5. Erro: suave (sem bloqueio) — mostra resposta correta após 1.5s e avança
6. Após última etapa: `guidedExample.compactThought` em destaque tipográfico especial
7. Botão `"Agora você tenta →"` → `onComplete()`

---

### `TheorySimulated.tsx` — T5 (Interação Simulada)

**Props:** `simulatedPractice: TheoryContent['simulatedPractice']`, `onComplete: () => void`

**Diferença de T4:** todos os passos visíveis como "lembrete" (dimmed) desde o início — o usuário preenche sem precisar revelar.

**Layout:**
```
5 × 36 = ?

Passo 1: ___ × 10 = [INPUT]
Passo 2: Metade de ___ = [INPUT]
```

Inputs preenchidos sequencialmente. Feedback por etapa. Após conclusão:
- Resposta final montada: `5 × 36 = 180 ✓`
- `simulatedPractice.successMessage` exibido
- Botão `"Ver o que evitar →"` → `onComplete()`

---

### `TheoryCommonError.tsx` — T6 (Erros Comuns)

**Props:** `commonError: TheoryContent['commonError']`, `onComplete: () => void`

**Estados internos:**
```typescript
const [answered, setAnswered] = useState<'correct' | 'wrong' | null>(null)
```

**Fluxo:**
1. Exibe: `commonError.wrongProblem.operand1 OP operand2 = wrongAnswer ?`
2. Pergunta: `"Esse resultado está correto?"`
3. Botões `[ Sim ]` `[ Não ]`
4. Se `"Não"` (correto): revela `errorStep` + `errorExplanation`
5. Se `"Sim"` (incorreto): revela educação sem penalidade
6. `cognitiveAnchor` em `BlueprintCard` com borda `var(--nm-accent-primary)`, fonte `font-data` uppercase, animação `scale: 0.9 → 1.0` (300ms)
7. Botão `"Pronto para o desafio →"` → `onComplete()`

**Persistência da âncora:**
O componente pai (`TheoryPhase`) recebe e armazena `cognitiveAnchor` para repassar ao `LessonTypeStructure` que injeta no Block4.

---

### `TheoryCalibration.tsx` — T7 (Desafio de Calibração)

**Props:** `calibration: TheoryContent['calibration']`, `onComplete: (status: 'ok' | 'assisted') => void`

**Estados internos:**
```typescript
type CalibrationPhase = 'single_input' | 'guided_fallback' | 'done'
const [phase, setPhase] = useState<CalibrationPhase>('single_input')
const [answer, setAnswer] = useState('')
const [stepAnswers, setStepAnswers] = useState<string[]>([])
const [currentStep, setCurrentStep] = useState(0)
```

**Fluxo — input único (fase inicial):**
1. Problema: `calibration.operand1 OP calibration.operand2 = ?`
2. Input único sem scaffolding
3. Correto → `onComplete('ok')`
4. Incorreto → entra em `guided_fallback`

**Fluxo — fallback guiado:**
1. Revela os steps de `calibration.steps` sequencialmente
2. Após completar todos (acerto ou não) → `onComplete('assisted')`

**Lógica:**
```typescript
const handleSingleSubmit = () => {
  if (num === calibration.answer) {
    onComplete('ok')
  } else {
    setPhase('guided_fallback')
  }
}
const handleAllStepsDone = () => {
  onComplete('assisted')
}
```

---

## Fase 2 — Integração em `LessonExecution.tsx`

### 2.1 Tipos de estado estendidos

Em `LessonTypeStructure`, adicionar ao estado:

```typescript
// Novo estado (além de currentBlock, block4Data, sessionData, finishing)
const [calibrationStatus, setCalibrationStatus] = useState<'ok' | 'assisted' | null>(null)
const [cognitiveAnchor, setCognitiveAnchor] = useState<string | null>(null)
```

### 2.2 Tipo de bloco estendido

```typescript
// De:
const [currentBlock, setCurrentBlock] = useState<1 | 2 | 3 | 4 | 5 | 6>(1)

// Para:
const [currentBlock, setCurrentBlock] = useState<1 | 'theory' | 3 | 4 | 5 | 6>(1)
```

### 2.3 Handler para conclusão da teoria

```typescript
const handleTheoryComplete = (status: 'ok' | 'assisted', anchor: string) => {
  setCalibrationStatus(status)
  setCognitiveAnchor(anchor)
  setCurrentBlock(3)
}
```

### 2.4 Substituição do Block 2

```typescript
// ANTES (bloco currentBlock === 2):
<StepBlock
  techniqueName={content.techniqueName}
  techniqueRule={content.techniqueRule}
  example={content.technique.example}
  steps={content.technique.steps}
  conclusion={content.technique.conclusion}
  onComplete={handleBlock2Complete}
/>

// DEPOIS:
{content.theory ? (
  <TheoryPhase
    content={content.theory}
    onComplete={(status) => handleTheoryComplete(status, content.theory!.commonError.cognitiveAnchor)}
  />
) : (
  <StepBlock
    techniqueName={content.techniqueName}
    techniqueRule={content.techniqueRule}
    example={content.technique.example}
    steps={content.technique.steps}
    conclusion={content.technique.conclusion}
    onComplete={handleBlock2Complete}
  />
)}
```

**Nota:** `handleBlock2Complete` ainda existe para o fallback. O `currentBlock === 2` permanece no type union enquanto houver conceitos sem `theory`.

### 2.5 Barra de progresso

```typescript
// ANTES:
const blockProgress: Record<number, number> = { 1: 17, 2: 33, 3: 50, 4: 67, 5: 83, 6: 100 }

// DEPOIS (quando content.theory existe):
const blockProgress: Record<string, number> = {
  1: 8,
  theory: 50,   // calculado dinamicamente pelo TheoryPhase via callback
  3: 58,
  4: 72,
  5: 86,
  6: 100,
}
```

**Alternativa mais simples** (sem callback de progresso): TheoryPhase recebe `onProgressChange(pct: number)` e o pai atualiza um state `theoryProgress` usado na barra.

```typescript
// Em LessonTypeStructure:
const [theoryProgress, setTheoryProgress] = useState(0)

const progressPercent =
  currentBlock === 1 ? 8 :
  currentBlock === 'theory' ? 8 + (theoryProgress * 0.42) :  // 8% → 50%
  currentBlock === 3 ? 58 :
  currentBlock === 4 ? 72 :
  currentBlock === 5 ? 86 :
  100
```

### 2.6 Label do header

```typescript
// ANTES:
AULA_ESTRUTURA // CONCEPT_XX // BLOCO_X

// DURANTE teoria:
AULA_ESTRUTURA // CONCEPT_XX // TEORIA_{subStep}/7
```

`TheoryPhase` recebe `onStepChange(step: number)` para notificar o número do sub-passo atual.

### 2.7 Âncora cognitiva no Block 4

`Block4Consolidation` recebe nova prop:

```typescript
interface BlockConsolidationProps {
  content: LessonContent
  recordAttempt: (attempt: ProblemAttempt) => void
  onComplete: (correctCount: number, times: number[]) => void
  cognitiveAnchor?: string | null   // ← NOVO
}
```

Dentro do componente, badge retrátil:

```typescript
const [anchorVisible, setAnchorVisible] = useState(true)
const [anchorCollapsed, setAnchorCollapsed] = useState(false)

// Após o 3.º problema resolvido:
useEffect(() => {
  if (index >= 2 && cognitiveAnchor) {
    setTimeout(() => setAnchorCollapsed(true), 500)
  }
}, [index])
```

**UI do badge:**
```tsx
{cognitiveAnchor && anchorVisible && (
  <motion.div
    animate={{ height: anchorCollapsed ? 20 : 'auto', opacity: anchorCollapsed ? 0.4 : 1 }}
    transition={{ duration: 0.4 }}
    className="absolute top-2 right-2 cursor-pointer"
    onClick={() => setAnchorCollapsed(c => !c)}
  >
    <div className="text-[9px] font-[family-name:var(--font-data)] uppercase tracking-[0.12em]
                    px-2 py-1 rounded border border-[var(--nm-accent-primary)]
                    text-[var(--nm-accent-primary)] bg-[var(--nm-bg-main)]">
      {anchorCollapsed ? '▸' : cognitiveAnchor}
    </div>
  </motion.div>
)}
```

### 2.8 Extensão de `useSession`

Adicionar ao estado de `useSession.ts`:

```typescript
// Novos refs
const theoryCompletedRef = useRef(false)
const calibrationStatusRef = useRef<'ok' | 'assisted' | null>(null)

// Nova função exportada
const recordTheoryCompletion = useCallback((status: 'ok' | 'assisted') => {
  theoryCompletedRef.current = true
  calibrationStatusRef.current = status
}, [])
```

Em `finishSession`, adicionar ao payload de `completeSession`:

```typescript
// Em session.service.ts, dentro do objeto de sessão enviado:
theory_completed: theoryCompletedRef.current,
calibration_status: calibrationStatusRef.current,
```

**Nota:** Não criar novas tabelas. Usar campo `metadata` existente ou adicionar ao JSON do `complete_session` RPC. Falha silenciosa se o banco não aceitar — não bloqueia o fluxo.

---

## Fase 3 — QA e refinamentos

### 3.1 Checklist de validação manual

Para cada conceito 1-8, verificar:

- [ ] T1: problema exibido corretamente, cálculo do gancho validado
- [ ] T2: todas as linhas revelam em sequência; múltipla escolha bloqueia na 1.ª tentativa errada
- [ ] T3: typewriter funciona; inputs desbloqueiam sequencialmente; após 2 erros: preenchimento auto
- [ ] T4: revelação por tap funciona; erro suave sem bloqueio
- [ ] T5: todos os steps visíveis desde o início; confirmação por etapa
- [ ] T6: âncora aparece em `BlueprintCard` com borda azul; badge aparece no B4
- [ ] T7: resposta correta → status `ok`; errada → fallback guiado → status `assisted`
- [ ] B4 com âncora: badge visível nos 2 primeiros problemas; colapsa no 3.º; toque expande

### 3.2 Checklist de retrocompatibilidade

- [ ] Conceitos 9-15 (sem `theory`) continuam renderizando `StepBlock` sem erro
- [ ] Conceitos 16-24 (Pro) continuam renderizando `StepBlock` sem erro
- [ ] Remover `currentBlock === 2` do type union quebra TypeScript → manter no union enquanto houver conceitos sem teoria

### 3.3 Performance

- [ ] `theoryContent.ts` é importado de forma estática — sem fetch em runtime
- [ ] `getTheoryContent(conceptId)` é chamado uma única vez no início do `LessonTypeStructure`
- [ ] Componentes T1-T7 não fazem chamadas de rede

### 3.4 Mobile

- [ ] Todos os inputs numéricos usam `inputMode="numeric"` (já padrão no projeto)
- [ ] Nenhum componente tem `overflow-x` em viewport 375px
- [ ] Badge da âncora cognitiva não sobrepõe o input no B4 (usar `absolute top-2 right-2` com `max-w-[140px]`)

---

## Resumo de arquivos por fase

### Fase 0
| Arquivo | Ação |
|---|---|
| `src/types/lesson.ts` | Adicionar `TheoryContent`, `TheoryStep`; estender `LessonContent` com `theory?` |
| `src/data/theoryContent.ts` | Criar — dados completos dos 8 conceitos |

### Fase 1
| Arquivo | Ação |
|---|---|
| `src/app/components/theory/TheoryPhase.tsx` | Criar |
| `src/app/components/theory/TheoryHook.tsx` | Criar |
| `src/app/components/theory/TheoryIntuition.tsx` | Criar |
| `src/app/components/theory/TheoryStrategy.tsx` | Criar |
| `src/app/components/theory/TheoryGuidedExample.tsx` | Criar |
| `src/app/components/theory/TheorySimulated.tsx` | Criar |
| `src/app/components/theory/TheoryCommonError.tsx` | Criar |
| `src/app/components/theory/TheoryCalibration.tsx` | Criar |

### Fase 2
| Arquivo | Ação |
|---|---|
| `src/app/pages/LessonExecution.tsx` | Modificar `LessonTypeStructure` — substituir Block2, atualizar progress bar e header |
| `src/hooks/useSession.ts` | Adicionar `recordTheoryCompletion`, `theoryCompletedRef`, `calibrationStatusRef` |
| `src/services/session.service.ts` | Adicionar `theory_completed`, `calibration_status` ao payload |

### Fase 3
| Atividade | Critério |
|---|---|
| Navegação manual T1→T7 (conceito 1) | Zero erros de runtime |
| Retrocompatibilidade (conceito 9) | `StepBlock` renderiza normalmente |
| Badge âncora no B4 | Colapsa após 3.º problema, toque expande |
| TypeScript check | `tsc --noEmit` sem erros |
