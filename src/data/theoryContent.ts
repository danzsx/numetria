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
