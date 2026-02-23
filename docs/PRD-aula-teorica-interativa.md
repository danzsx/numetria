# PRD — Aula Teórica Interativa (Fase Pedagógica Anterior à Prática)

**Status:** Proposta
**Data:** 2026-02-22
**Escopo:** Aula 1 (Estrutura) de todos os conceitos — Módulo Foundational e futuras expansões
**Depende de:** `docs/conteudo_aulas.md`, `docs/MOTOR PEDAGÓGICO e CONTEUDO.md`

---

## 1. Problema

### 1.1 Gap pedagógico central

A plataforma atual pula do **aquecimento neural** (Block 1) diretamente para a **demonstração da técnica** (Block 2), que é exibida como um card estático com passos listados. O usuário lê, clica em "continuar" e vai direto para prática guiada.

**Isso viola o princípio fundamental do produto:**

> "Estrutura antes de compressão. Todo conceito segue três camadas: Explícito estruturado → Guiado com menos suporte → Executado mentalmente de forma comprimida."
> — *MOTOR PEDAGÓGICO e CONTEUDO.md*

O "Explícito estruturado" atual dura cerca de 20 segundos. Não há:

- Construção progressiva do conceito (o usuário não chega à técnica por raciocínio — ela é entregue pronta)
- Intuição cognitiva (por que essa técnica funciona para o cérebro?)
- Simulação guiada antes do exercício real
- Exposição consciente a erros comuns antes de cometê-los
- Momento de desafio de calibração pré-prática

### 1.2 Consequência observável

Usuários chegam ao Bloco 4 (Consolidação) sem ter **internalizado** a técnica — apenas memorizaram os passos. Isso se manifesta como:

- Alta variabilidade de tempo nas primeiras tentativas
- Erros de decomposição nos primeiros 2-3 problemas (o usuário "descobre" a técnica durante a prática)
- Taxa maior de status `unstable` na primeira sessão de um conceito novo

### 1.3 Conteúdo existente não aproveitado

O arquivo `docs/conteudo_aulas.md` contém, para cada conceito, **8 seções pedagógicas ricas**:

1. Conceito Fundamental
2. Intuição Cognitiva
3. Macete / Estratégia Mental
4. Exemplo Guiado Passo a Passo Mental
5. Interação Simulada
6. Microprogressão
7. Erros Comuns
8. Desafio Final

Nenhuma dessas seções é usada diretamente no fluxo atual da Aula 1. O conteúdo existente em `lessonContent.ts` usa apenas os dados de prática (warmup, guided, consolidation, compression). **O espaço teórico não existe.**

---

## 2. Filosofia de Design

### 2.1 Princípio central: Aprende primeiro, pratica depois

```
TEORIA INTERATIVA  →  PRÁTICA GUIADA  →  PRÁTICA INDEPENDENTE
    (nova)              (existente)          (existente)
```

O usuário não toca em um exercício de prática sem antes ter:

1. Compreendido **por que** a técnica funciona (intuição cognitiva)
2. Visto a técnica executada **passo a passo** em um exemplo
3. **Participado** de uma execução simulada com scaffolding máximo
4. Sido alertado sobre os **erros mais comuns** que vai cometer
5. Resolvido **um desafio** de calibração antes da prática real

### 2.2 Princípio: Aprendizado ativo, não leitura passiva

Cada "tela teórica" exige uma **micro-ação** do usuário:

- Tap para revelar o próximo passo (não scroll)
- Completar lacunas no raciocínio ("14 × 10 = ___")
- Escolher o passo correto entre opções (detecção de erro antes de cometer)
- Confirmar que entendeu antes de avançar
- Receber reflexão sonora/visual imediata a cada micro-ação

Não há texto para ler como em um livro. Há uma **conversa estruturada** entre o sistema e o usuário.

### 2.3 Princípio: Progressão cognitiva CRA

Cada aula teórica segue a sequência **Concreto → Representacional → Abstrato**:

- **Concreto:** "5 × 14 é contar 14, cinco vezes. Isso é lento."
- **Representacional:** "Mas 5 = 10 ÷ 2. Então podemos trocar."
- **Abstrato:** "n × 5 = (n × 10) ÷ 2. Sempre."

### 2.4 Princípio: Erro como evento de aprendizado, não como falha

Seções de erros comuns não são alertas de aviso — são **exercícios de reconhecimento**. O usuário identifica o erro em um cálculo apresentado, antes de ver a explicação. Isso cria uma memória ativa ("eu já vi isso errado — vou prestar atenção nesse passo").

---

## 3. Estrutura da Aula Teórica Interativa

### 3.1 Posição no fluxo da Aula 1

A Aula Teórica Interativa substitui o **Bloco 2 atual** (StepBlock estático) e se expande para uma sequência de **5 a 7 telas**, cada uma com duração estimada de 30 a 60 segundos.

```
FLUXO ATUAL (Aula 1):
  [B1 Warmup] → [B2 Técnica estática] → [B3 Guiado] → [B4 Consolidação] → [B5 Compressão] → [B6 Síntese]

FLUXO PROPOSTO (Aula 1):
  [B1 Warmup] → [TEORIA: T1→T2→T3→T4→T5→T6→T7] → [B3 Guiado] → [B4 Consolidação] → [B5 Compressão] → [B6 Síntese]
```

A barra de progresso existente expande para refletir todos os estágios, incluindo os sub-passos teóricos.

---

### Tela T1 — Gancho Cognitivo (Conceito Fundamental)

**Objetivo pedagógico:** Criar dissonância cognitiva que motiva a aprender a técnica.
**Duração estimada:** 20-30s
**Interação:** Tap progressivo + input de estimativa

#### Fluxo da tela:

1. Sistema exibe o problema sem qualquer explicação:
   ```
   5 × 28 = ?
   ```

2. Abaixo, dois botões:
   ```
   [ Eu sei calcular ]     [ Não sei ao certo ]
   ```

3. Se "Eu sei calcular": campo numérico para resposta. Após confirmar, o sistema responde:
   - Se correto: `"Correto. Você vai aprender por que isso funciona."`
   - Se incorreto: `"A resposta é 140. Você vai aprender a chegar lá mentalmente."`

4. Se "Não sei ao certo": `"Tudo bem. Você vai aprender agora."`

5. Animação: o número "28" se desmonta visualmente → dois fragmentos → "× 10" e "÷ 2" (hint visual, sem explicação ainda).

6. Botão: `"Ver como funciona →"`

#### Especificação de conteúdo (por conceito):

| Conceito | Problema gancho | Dica visual |
|---|---|---|
| Mult × 5 | `5 × 28 = ?` | 28 → ×10 → ÷2 |
| Soma com transporte | `48 + 37 = ?` | unidades → dezena sobe |
| Mult × 9 | `9 × 23 = ?` | 23 → ×10 → −23 |
| Divisão por 2 | `84 ÷ 2 = ?` | 80→40, 4→2 |
| Mult × 2 e × 4 | `4 × 27 = ?` | dobro → dobro |
| Adição 3 parcelas | `27 + 38 + 13 = ?` | agrupar → somar |
| Subtração positiva | `74 − 38 = ?` | 74 → −30 → −8 |
| Mult × 10 e × 100 | `36 × 100 = ?` | casas decimais |

---

### Tela T2 — Intuição Cognitiva (Por que funciona?)

**Objetivo pedagógico:** Ancorar a técnica em raciocínio, não em memorização.
**Duração estimada:** 30-45s
**Interação:** Revelação progressiva + confirmação de compreensão

#### Fluxo da tela:

1. Título: `POR QUE FUNCIONA`

2. Linha 1 aparece: `"Multiplicar por 5 repete a soma 5 vezes."`
   Pausa de 1s.

3. Linha 2 aparece: `"5 = 10 ÷ 2"`
   Pausa de 1s.

4. Linha 3 aparece como equação destacada:
   ```
   n × 5 = (n × 10) ÷ 2
   ```

5. Explicação em uma linha: `"Multiplicar por 10 é automático. Dividir por 2 é tirar a metade."`

6. Micro-input de confirmação — o sistema pergunta:
   ```
   Por que dividimos por 2 depois?
   ```
   Opções de múltipla escolha:
   - `"Porque 5 é metade de 10"` ← correto
   - `"Para diminuir o erro"`
   - `"Porque o resultado seria muito grande"`

7. Se correto: feedback imediato positivo + animação sutil.
   Se incorreto: sistema explica com a equação antes de avançar.

8. Botão: `"Entendido →"`

#### Critério de avanço:

O usuário só avança após acertar a questão de compreensão OU após a segunda tentativa (com explicação automática mostrada).

---

### Tela T3 — Estratégia Mental (O Algoritmo Interno)

**Objetivo pedagógico:** Instalar o "script" de pensamento interno que o usuário usará durante a prática.
**Duração estimada:** 25-40s
**Interação:** Completar o "pensamento" em lacunas guiadas

#### Fluxo da tela:

1. Título: `ESTRATÉGIA_MENTAL`

2. O sistema simula o pensamento interno em formato de "voz":
   ```
   "14 vezes 5…"
   ```
   Aparece gradualmente, palavra por palavra.

3. Continua:
   ```
   "14 vezes 10 dá ___"
   ```
   Campo numérico pequeno onde o usuário completa: `140`

4. Se correto, continua:
   ```
   "metade de 140 é ___"
   ```
   Campo: `70`

5. Síntese final aparece:
   ```
   "5 × 14 = 70"
   ```
   Com uma linha conectando os passos visualmente.

6. Label técnica: `"Esse é o padrão mental que você vai automatizar."`

7. Botão: `"Ver exemplo completo →"`

#### Nota de design:

A tipografia deve simular "pensamento interno" — fonte levemente diferente, tamanho menor, letra por letra ou palavra por palavra com animação de typewriter suave. Cria a sensação de "ouvir o próprio raciocínio".

---

### Tela T4 — Exemplo Guiado Passo a Passo

**Objetivo pedagógico:** Ver a técnica completa executada em um exemplo diferente do gancho inicial.
**Duração estimada:** 40-60s
**Interação:** Revelar cada passo com tap + confirmação de cada etapa

#### Fluxo da tela:

1. Título: `EXEMPLO_GUIADO`

2. Problema apresentado:
   ```
   5 × 28
   ```

3. Sistema revela passo 1 com tap do usuário:
   ```
   Etapa 1: 28 × 10 = ?
   ```
   Input: `280`

4. Confirmação visual do passo 1. Revela passo 2:
   ```
   Etapa 2: Metade de 280 = ?
   ```
   Input: `140`

5. Conclusão:
   ```
   5 × 28 = 140  ✓
   ```
   Animação de "encaixe" dos dois passos resultando na resposta.

6. "Pensamento compacto" aparece abaixo:
   ```
   "28 vira 280… metade é 140."
   ```

7. Botão: `"Agora você tenta →"`

#### Nota de design:

Cada passo intermediário usa o componente `GuidedStepInput` já existente — apenas recontextualizado dentro de um fluxo teórico, não de prática. O feedback de erro aqui é suave: o sistema completa o valor correto e explica, sem penalidade.

---

### Tela T5 — Interação Simulada (Você Tenta)

**Objetivo pedagógico:** Primeira execução autônoma com máximo scaffolding ainda disponível.
**Duração estimada:** 45-60s
**Interação:** Resolver um problema completo com os passos visíveis como "guia"

#### Fluxo da tela:

1. Título: `SUA_VEZ`

2. Problema novo:
   ```
   5 × 36 = ?
   ```

3. Abaixo do problema, os dois passos aparecem como "lembretes" (texto dimmed, não ocultos):
   ```
   Passo 1: ___ × 10 = ___
   Passo 2: Metade de ___ = ___
   ```

4. O usuário preenche cada lacuna em sequência:
   - `36 × 10 =` → input → `360`
   - `Metade de 360 =` → input → `180`

5. Sistema confirma cada input individualmente.

6. Resposta final montada visualmente:
   ```
   5 × 36 = 180  ✓
   ```

7. Feedback motivacional técnico (não emocional, alinhado ao tom da plataforma):
   ```
   "Estrutura executada. Dois passos, resultado correto."
   ```

8. Botão: `"Ver o que evitar →"`

#### Distinção de T5 vs Bloco 3 (Prática Guiada):

- **T5** = ainda na fase teórica. Passos visíveis. Objetivo é confirmar compreensão.
- **Bloco 3** = prática guiada. Passos solicitados um por um, sem o "lembrete" visual dos passos.
- **Bloco 4** = prática independente. Sem scaffolding.

---

### Tela T6 — Erros Comuns (Imunização Cognitiva)

**Objetivo pedagógico:** Criar memória ativa dos erros antes de cometê-los. "Já vi isso errado — não vou cair."
**Duração estimada:** 30-45s
**Interação:** Identificar o erro em um cálculo apresentado

#### Fluxo da tela:

1. Título: `ERRO_COMUM`

2. O sistema apresenta um cálculo incorreto:
   ```
   5 × 18 = 180 ?
   ```

3. Pergunta:
   ```
   Esse resultado está correto?
   ```
   Opções: `[ Sim ]` `[ Não ]`

4. Se "Não" (correto): sistema revela o erro:
   ```
   Erro: O resultado é 90, não 180.

   O cérebro parou na Etapa 1.
   Multiplicou por 10 (✓)
   Mas esqueceu de dividir por 2 (✗)

   Sempre verificar: "Já tirei a metade?"
   ```

5. Se "Sim" (incorreto): sistema educa sem penalidade:
   ```
   Não está. 18 × 10 = 180 é a Etapa 1.
   Mas falta a Etapa 2: 180 ÷ 2 = 90.
   O resultado correto é 90.
   ```

6. Âncora cognitiva exibida em destaque:
   ```
   "Já tirei a metade?"
   ```
   Esta frase fica visível nos primeiros exercícios de prática como lembrete retrátil.

7. Botão: `"Pronto para o desafio →"`

---

### Tela T7 — Desafio de Calibração (Pré-prática)

**Objetivo pedagógico:** Validar que a técnica está internalizada antes de entrar na prática independente. Calibra a dificuldade inicial do Bloco 4.
**Duração estimada:** 30-40s
**Interação:** Resolver o problema mais difícil apresentado até aqui, sem scaffolding

#### Fluxo da tela:

1. Título: `CALIBRAÇÃO`

2. Subtítulo: `"Um problema maior. Mesma técnica."`

3. Problema:
   ```
   5 × 248 = ?
   ```
   (Sem passos visíveis. Input único.)

4. Input de resposta: `1240`

5. Se correto:
   ```
   "Estrutura transferida para número maior."

   248 × 10 = 2480
   Metade de 2480 = 1240  ✓

   Sistema pronto para prática.
   ```

   Status: `CALIBRAÇÃO_OK` → Prática começa no nível padrão.

6. Se incorreto (primeira tentativa):
   Sistema revela os passos e pede para tentar novamente:
   ```
   248 × 10 = ?  →  _____
   Metade de ___ = ?  →  _____
   ```

   Status após a segunda tentativa (acerto ou não): `CALIBRAÇÃO_ASSISTIDA` → Prática começa com um problema menor primeiro.

7. Botão: `"Iniciar prática →"`

#### Lógica de calibração:

```typescript
type CalibrationStatus = 'ok' | 'assisted'

// ok     → Bloco 3 começa com o problema de dificuldade padrão
// assisted → Bloco 3 começa com o problema mais simples da sequência
```

---

## 4. Integração com o Fluxo Existente

### 4.1 Onde se encaixa em `LessonExecution.tsx`

```typescript
// Bloco atual: 1 | 2 | 3 | 4 | 5 | 6
// Proposto:    1 | T  | 3 | 4 | 5 | 6
//              onde T = sub-estados T1...T7

type TheorySubStep = 'T1_hook' | 'T2_intuition' | 'T3_strategy' |
                     'T4_guided_example' | 'T5_simulated' |
                     'T6_errors' | 'T7_calibration'

type LessonBlock = 1 | 'theory' | 3 | 4 | 5 | 6
```

O componente `StepBlock` existente (Block 2 atual) é **substituído** por um novo componente `TheoryPhase` que gerencia os sub-passos T1-T7 com seu próprio estado interno.

### 4.2 Barra de progresso

A barra de progresso é atualizada para refletir a fase teórica como um segmento contíguo:

```
[B1: 8%] [T1-T7: 8-50%] [B3: 58%] [B4: 72%] [B5: 86%] [B6: 100%]
```

Durante a fase teórica, a barra avança suavemente a cada sub-passo T concluído.

### 4.3 Label do header

```
AULA_ESTRUTURA // CONCEPT_01 // TEORIA_3/7
```
O sub-passo atual (ex: "3/7") é exibido durante a fase teórica.

### 4.4 Sessão e métricas

- A fase teórica **não gera ProblemAttempts** no `useSession` (é fase de aprendizado, não de medição de performance)
- O `startSession` é chamado no início do Bloco 1 (warmup), como hoje
- Os dados do Desafio T7 **são registrados** como um attempt especial de tipo `'calibration'` (extensão leve do tipo `ProblemAttempt`)
- `theoryCompleted: boolean` é adicionado ao estado da sessão para distinguir sessões com fase teórica completa

### 4.5 Retorno após erro no Bloco 4

Se o usuário tiver status `CALIBRAÇÃO_ASSISTIDA` (T7), o Bloco 4 exibe um **lembrete retrátil** nos primeiros 2 problemas:

```
[Lembrete: Passo 1 → ×10 | Passo 2 → ÷2]  [Ocultar]
```

Após o terceiro problema, o lembrete desaparece automaticamente.

---

## 5. Especificação de Conteúdo por Conceito

### 5.1 Contrato de dados — `TheoryContent`

O arquivo `lessonContent.ts` precisa de uma nova estrutura de dados `TheoryContent` para cada conceito:

```typescript
interface TheoryContent {
  conceptId: number

  // T1 — Gancho
  hook: {
    problem: { operand1: number; operand2: number; operation: string }
    answer: number
    visualHint: string   // descrição textual da animação de desmontagem
  }

  // T2 — Intuição Cognitiva
  intuition: {
    lines: string[]      // reveladas progressivamente
    keyEquation: string  // ex: "n × 5 = (n × 10) ÷ 2"
    comprehensionQuestion: {
      question: string
      options: string[]
      correctIndex: number
      explanation: string
    }
  }

  // T3 — Estratégia Mental
  strategy: {
    innerVoice: string[]          // array de frases do pensamento interno
    gapInputs: Array<{
      prompt: string
      answer: number
    }>
  }

  // T4 — Exemplo Guiado
  guidedExample: {
    operand1: number
    operand2: number
    steps: Array<{
      prompt: string
      answer: number
    }>
    compactThought: string
  }

  // T5 — Interação Simulada
  simulatedPractice: {
    operand1: number
    operand2: number
    steps: Array<{
      prompt: string
      answer: number
    }>
    successMessage: string
  }

  // T6 — Erros Comuns
  commonError: {
    wrongProblem: { operand1: number; operand2: number; wrongAnswer: number }
    errorStep: string
    errorExplanation: string
    cognitiveAnchor: string   // frase de âncora — ex: "Já tirei a metade?"
  }

  // T7 — Desafio de Calibração
  calibration: {
    operand1: number
    operand2: number
    answer: number
    steps: Array<{ prompt: string; answer: number }>
  }
}
```

### 5.2 Conteúdo para os 8 conceitos Foundational

#### Conceito 1 — Multiplicação por 5

```typescript
{
  conceptId: 1,

  hook: {
    problem: { operand1: 5, operand2: 28, operation: 'multiplication' },
    answer: 140,
    visualHint: 'número 28 se divide em ×10 e ÷2'
  },

  intuition: {
    lines: [
      'Multiplicar por 5 repete a soma 5 vezes.',
      'Mas 5 = 10 ÷ 2.',
      'Então multiplicar por 5 é multiplicar por 10 e pegar a metade.'
    ],
    keyEquation: 'n × 5 = (n × 10) ÷ 2',
    comprehensionQuestion: {
      question: 'Por que dividimos por 2 depois de multiplicar por 10?',
      options: [
        'Porque 5 é metade de 10',
        'Para diminuir o erro',
        'Porque o resultado seria muito grande'
      ],
      correctIndex: 0,
      explanation: '5 é exatamente a metade de 10. Então ×10 e depois ÷2 é o mesmo que ×5.'
    }
  },

  strategy: {
    innerVoice: ['14 vezes 5…', '14 vezes 10 dá ___', 'metade de ___ é ___'],
    gapInputs: [
      { prompt: '14 × 10 =', answer: 140 },
      { prompt: 'Metade de 140 =', answer: 70 }
    ]
  },

  guidedExample: {
    operand1: 5, operand2: 28,
    steps: [
      { prompt: '28 × 10 =', answer: 280 },
      { prompt: 'Metade de 280 =', answer: 140 }
    ],
    compactThought: '"28 vira 280… metade é 140."'
  },

  simulatedPractice: {
    operand1: 5, operand2: 36,
    steps: [
      { prompt: '36 × 10 =', answer: 360 },
      { prompt: 'Metade de 360 =', answer: 180 }
    ],
    successMessage: 'Estrutura executada. Dois passos, resultado correto.'
  },

  commonError: {
    wrongProblem: { operand1: 5, operand2: 18, wrongAnswer: 180 },
    errorStep: 'Multiplicou por 10 (✓) mas esqueceu de dividir por 2 (✗)',
    errorExplanation: 'O cérebro parou na primeira etapa automática. O resultado correto é 90.',
    cognitiveAnchor: '"Já tirei a metade?"'
  },

  calibration: {
    operand1: 5, operand2: 248, answer: 1240,
    steps: [
      { prompt: '248 × 10 =', answer: 2480 },
      { prompt: 'Metade de 2480 =', answer: 1240 }
    ]
  }
}
```

#### Conceito 2 — Soma até 100 com transporte

```typescript
{
  conceptId: 2,

  hook: {
    problem: { operand1: 48, operand2: 37, operation: 'addition' },
    answer: 85,
    visualHint: 'unidades 8+7 passam de 9 — uma dezena sobe'
  },

  intuition: {
    lines: [
      'Quando somamos unidades e passamos de 9, formamos uma dezena nova.',
      '8 + 7 = 15. Ficam 5 unidades. Sobe 1 dezena.',
      'O cérebro fecha blocos completos de 10 — isso reduz esforço mental.'
    ],
    keyEquation: 'Unidades ≥ 10 → 1 dezena sobe',
    comprehensionQuestion: {
      question: 'O que acontece quando a soma das unidades passa de 9?',
      options: [
        'Formamos uma nova dezena e subimos 1',
        'Descartamos o excesso',
        'Somamos direto nas dezenas'
      ],
      correctIndex: 0,
      explanation: '10 unidades = 1 dezena. Quando passa de 9, separamos: ficam as unidades, e 1 dezena sobe.'
    }
  },

  strategy: {
    innerVoice: ['8 mais 7 dá 15…', 'fico com ___ unidades…', 'sobe 1… agora 4 + 3 + 1 = ___'],
    gapInputs: [
      { prompt: '8 + 7 = (fico com unidades)', answer: 5 },
      { prompt: '4 + 3 + 1 (dezenas + transporte) =', answer: 8 }
    ]
  },

  guidedExample: {
    operand1: 48, operand2: 37,
    steps: [
      { prompt: 'Unidades: 8 + 7 =', answer: 15 },
      { prompt: 'Ficam de unidades:', answer: 5 },
      { prompt: 'Dezenas: 4 + 3 + 1 =', answer: 8 }
    ],
    compactThought: '"8 + 7 = 15… fico com 5… sobe 1… 4+3+1=8… resultado: 85"'
  },

  simulatedPractice: {
    operand1: 56, operand2: 29,
    steps: [
      { prompt: 'Unidades: 6 + 9 =', answer: 15 },
      { prompt: 'Ficam de unidades:', answer: 5 },
      { prompt: 'Dezenas: 5 + 2 + 1 =', answer: 8 }
    ],
    successMessage: 'Transporte executado. Estrutura correta.'
  },

  commonError: {
    wrongProblem: { operand1: 48, operand2: 37, wrongAnswer: 75 },
    errorStep: 'Somou 4 + 3 = 7 nas dezenas (✗) — esqueceu o transporte (✗)',
    errorExplanation: 'As unidades deram 15: fica 5 e sobe 1. As dezenas são 4 + 3 + 1 = 8. Resultado: 85.',
    cognitiveAnchor: '"Subiu alguma dezena?"'
  },

  calibration: {
    operand1: 86, operand2: 57, answer: 143,
    steps: [
      { prompt: 'Unidades: 6 + 7 =', answer: 13 },
      { prompt: 'Ficam de unidades:', answer: 3 },
      { prompt: 'Dezenas: 8 + 5 + 1 =', answer: 14 }
    ]
  }
}
```

#### Conceito 3 — Multiplicação por 9

```typescript
{
  conceptId: 3,

  hook: {
    problem: { operand1: 9, operand2: 23, operation: 'multiplication' },
    answer: 207,
    visualHint: '23 → ×10 → −23'
  },

  intuition: {
    lines: [
      'Multiplicar por 9 diretamente é trabalhoso.',
      'Mas 9 = 10 − 1.',
      'Então n × 9 = (n × 10) − n. Troca uma operação pesada por duas simples.'
    ],
    keyEquation: 'n × 9 = (n × 10) − n',
    comprehensionQuestion: {
      question: 'Por que subtraímos o número original depois de multiplicar por 10?',
      options: [
        'Porque 9 = 10 − 1, então ×9 = ×10 e depois −1×',
        'Para compensar o arredondamento',
        'Para facilitar a divisão'
      ],
      correctIndex: 0,
      explanation: '9 é 10 menos 1. Então n×9 é n×10 menos n×1, ou seja, menos o próprio n.'
    }
  },

  strategy: {
    innerVoice: ['23 vezes 9…', '23 vezes 10 dá ___', 'agora tiro 23: ___ − 23 = ___'],
    gapInputs: [
      { prompt: '23 × 10 =', answer: 230 },
      { prompt: '230 − 23 =', answer: 207 }
    ]
  },

  guidedExample: {
    operand1: 9, operand2: 23,
    steps: [
      { prompt: '23 × 10 =', answer: 230 },
      { prompt: '230 − 20 =', answer: 210 },
      { prompt: '210 − 3 =', answer: 207 }
    ],
    compactThought: '"23 vira 230… tiro 23 em partes: −20=210, −3=207"'
  },

  simulatedPractice: {
    operand1: 9, operand2: 47,
    steps: [
      { prompt: '47 × 10 =', answer: 470 },
      { prompt: '470 − 40 =', answer: 430 },
      { prompt: '430 − 7 =', answer: 423 }
    ],
    successMessage: 'Compensação executada. Estrutura reconhecida.'
  },

  commonError: {
    wrongProblem: { operand1: 9, operand2: 35, wrongAnswer: 315 },
    errorStep: 'Multiplicou 35 × 9 como se fosse 35 × 10 sem subtrair (✗)',
    errorExplanation: '35 × 10 = 350. Mas falta subtrair 35: 350 − 35 = 315 está correto — mas foi por acidente, sem estrutura. O erro real é não decompor a subtração: 350 − 30 = 320, 320 − 5 = 315.',
    cognitiveAnchor: '"Separei dezenas e unidades ao subtrair?"'
  },

  calibration: {
    operand1: 9, operand2: 256, answer: 2304,
    steps: [
      { prompt: '256 × 10 =', answer: 2560 },
      { prompt: '2560 − 200 =', answer: 2360 },
      { prompt: '2360 − 50 =', answer: 2310 },
      { prompt: '2310 − 6 =', answer: 2304 }
    ]
  }
}
```

#### Conceito 4 — Divisão exata por 2

```typescript
{
  conceptId: 4,

  hook: {
    problem: { operand1: 84, operand2: 2, operation: 'division' },
    answer: 42,
    visualHint: '84 se divide em 80 e 4 → cada metade'
  },

  intuition: {
    lines: [
      'Dividir por 2 é encontrar a metade.',
      'O cérebro reconhece paridade com facilidade.',
      'Separamos o número em dezenas e unidades e tiramos a metade de cada parte.'
    ],
    keyEquation: 'a÷2 + b÷2 = (a+b)÷2',
    comprehensionQuestion: {
      question: 'Por que decompor o número antes de dividir por 2?',
      options: [
        'Para tirar a metade de cada parte separadamente, o que é mais simples',
        'Para evitar números decimais',
        'Porque a divisão não funciona em números maiores'
      ],
      correctIndex: 0,
      explanation: 'Metade de 80 e metade de 4 são operações triviais. Some os resultados: 40 + 2 = 42.'
    }
  },

  strategy: {
    innerVoice: ['84 dividido por 2…', 'metade de 80 é ___', 'metade de 4 é ___', 'resultado: ___'],
    gapInputs: [
      { prompt: 'Metade de 80 =', answer: 40 },
      { prompt: 'Metade de 4 =', answer: 2 }
    ]
  },

  guidedExample: {
    operand1: 84, operand2: 2,
    steps: [
      { prompt: '80 ÷ 2 =', answer: 40 },
      { prompt: '4 ÷ 2 =', answer: 2 }
    ],
    compactThought: '"80 vira 40, 4 vira 2, resultado 42."'
  },

  simulatedPractice: {
    operand1: 96, operand2: 2,
    steps: [
      { prompt: '90 ÷ 2 =', answer: 45 },
      { prompt: '6 ÷ 2 =', answer: 3 }
    ],
    successMessage: 'Decomposição executada. Estrutura correta.'
  },

  commonError: {
    wrongProblem: { operand1: 128, operand2: 2, wrongAnswer: 54 },
    errorStep: 'Dividiu apenas 100 ÷ 2 = 50 e esqueceu as dezenas e unidades (✗)',
    errorExplanation: '128 = 100 + 20 + 8. Metade de 100 = 50, metade de 20 = 10, metade de 8 = 4. Total: 64.',
    cognitiveAnchor: '"Decompu completamente antes de dividir?"'
  },

  calibration: {
    operand1: 1256, operand2: 2, answer: 628,
    steps: [
      { prompt: '1200 ÷ 2 =', answer: 600 },
      { prompt: '56 ÷ 2 =', answer: 28 }
    ]
  }
}
```

#### Conceito 5 — Multiplicação por 2 e 4

```typescript
{
  conceptId: 5,

  hook: {
    problem: { operand1: 4, operand2: 27, operation: 'multiplication' },
    answer: 108,
    visualHint: '27 → dobro → dobro novamente'
  },

  intuition: {
    lines: [
      'Multiplicar por 2 é dobrar.',
      '4 = 2 × 2. Então multiplicar por 4 é dobrar duas vezes.',
      'Dobrar é uma das operações mais estáveis mentalmente.'
    ],
    keyEquation: 'n × 4 = dobro(dobro(n))',
    comprehensionQuestion: {
      question: 'Para multiplicar por 4, dobro quantas vezes?',
      options: [
        'Duas vezes',
        'Uma vez',
        'Quatro vezes'
      ],
      correctIndex: 0,
      explanation: '4 = 2 × 2. Então ×4 é dobrar e depois dobrar de novo.'
    }
  },

  strategy: {
    innerVoice: ['18 vezes 4…', 'dobro de 18 é ___', 'dobro de ___ é ___'],
    gapInputs: [
      { prompt: 'Dobro de 18 =', answer: 36 },
      { prompt: 'Dobro de 36 =', answer: 72 }
    ]
  },

  guidedExample: {
    operand1: 4, operand2: 18,
    steps: [
      { prompt: 'Dobro de 18 =', answer: 36 },
      { prompt: 'Dobro de 36 =', answer: 72 }
    ],
    compactThought: '"18 → 36 → 72. Dois dobros."'
  },

  simulatedPractice: {
    operand1: 4, operand2: 27,
    steps: [
      { prompt: 'Dobro de 27 =', answer: 54 },
      { prompt: 'Dobro de 54 =', answer: 108 }
    ],
    successMessage: 'Dois dobros executados. Estrutura reconhecida.'
  },

  commonError: {
    wrongProblem: { operand1: 4, operand2: 23, wrongAnswer: 46 },
    errorStep: 'Dobrou apenas uma vez (23 × 2 = 46) em vez de duas (✗)',
    errorExplanation: 'Para ×4 são dois dobros: 23→46→92. O erro é parar no primeiro dobro.',
    cognitiveAnchor: '"Dobrei duas vezes?"'
  },

  calibration: {
    operand1: 4, operand2: 248, answer: 992,
    steps: [
      { prompt: 'Dobro de 248 =', answer: 496 },
      { prompt: 'Dobro de 496 =', answer: 992 }
    ]
  }
}
```

#### Conceito 6 — Adição de três parcelas

```typescript
{
  conceptId: 6,

  hook: {
    problem: { operand1: 27, operand2: 38, operation: 'addition' }, // na verdade 27+38+13
    answer: 78,
    visualHint: '27 e 13 se agrupam em 40 antes de somar 38'
  },

  intuition: {
    lines: [
      'Somar na ordem dada nem sempre é o caminho mais curto.',
      'O cérebro prefere fechar dezenas cheias.',
      'Identificar dois números que somam 10 ou múltiplo de 10 reduz o esforço.'
    ],
    keyEquation: 'a + b + c → (par que fecha 10) + restante',
    comprehensionQuestion: {
      question: 'Por que reagrupar os números antes de somar os três?',
      options: [
        'Para criar uma dezena cheia e facilitar a soma final',
        'Porque a ordem dos números importa para o resultado',
        'Para evitar o transporte'
      ],
      correctIndex: 0,
      explanation: 'Fechando 27 + 13 = 40 primeiro, somamos 40 + 38 = 78. Muito mais simples que 27 + 38 = 65, depois 65 + 13.'
    }
  },

  strategy: {
    innerVoice: ['27 + 38 + 13…', 'vejo que ___ + ___ fecha 40…', '40 + 38 = ___'],
    gapInputs: [
      { prompt: '27 + 13 (par que fecha dezena) =', answer: 40 },
      { prompt: '40 + 38 =', answer: 78 }
    ]
  },

  guidedExample: {
    operand1: 27, operand2: 38,
    steps: [
      { prompt: '27 + 13 (fechando dezena) =', answer: 40 },
      { prompt: '40 + 38 =', answer: 78 }
    ],
    compactThought: '"27 e 13 fecham 40. 40 + 38 = 78."'
  },

  simulatedPractice: {
    operand1: 46, operand2: 19,
    steps: [
      { prompt: '46 + 14 (fechando dezena) =', answer: 60 },
      { prompt: '60 + 19 =', answer: 79 }
    ],
    successMessage: 'Reagrupamento executado. Dezena fechada com precisão.'
  },

  commonError: {
    wrongProblem: { operand1: 48, operand2: 12, wrongAnswer: 69 }, // 48+12+9, soma direto
    errorStep: 'Somou 48+12=60 correto mas calculou 60+9=69 (✓) — nesse caso acertou sem reagrupar, mas o ponto é reconhecer o par',
    errorExplanation: 'O erro é não identificar que 48+12=60 é o par ideal. Em 36+24+15, soma-se 36+24=60, depois 60+15=75. Sempre procure o par que fecha a dezena.',
    cognitiveAnchor: '"Identificei o par que fecha a dezena?"'
  },

  calibration: {
    operand1: 68, operand2: 27, answer: 127, // 68+27+32
    steps: [
      { prompt: '68 + 32 (par que fecha centena) =', answer: 100 },
      { prompt: '100 + 27 =', answer: 127 }
    ]
  }
}
```

#### Conceito 7 — Subtração com resultado positivo

```typescript
{
  conceptId: 7,

  hook: {
    problem: { operand1: 74, operand2: 38, operation: 'subtraction' },
    answer: 36,
    visualHint: '74 − 30 → depois − 8'
  },

  intuition: {
    lines: [
      'Subtrair um número inteiro de uma vez pode ser confuso.',
      'O cérebro trabalha melhor em etapas: subtrair dezenas, depois unidades.',
      'É a estratégia de compensação: desmontar o subtraendo.'
    ],
    keyEquation: 'a − bc = (a − b0) − c',
    comprehensionQuestion: {
      question: 'Por que subtraímos as dezenas primeiro?',
      options: [
        'Porque é mais simples subtrair em partes do que tudo de uma vez',
        'Para manter o resultado positivo',
        'Porque as unidades precisam do resultado das dezenas'
      ],
      correctIndex: 0,
      explanation: '74 − 30 = 44 é direto. Depois 44 − 8 = 36. Dois passos simples versus uma subtração complexa.'
    }
  },

  strategy: {
    innerVoice: ['74 menos 38…', '74 menos 30 é ___', '___ menos 8 é ___'],
    gapInputs: [
      { prompt: '74 − 30 =', answer: 44 },
      { prompt: '44 − 8 =', answer: 36 }
    ]
  },

  guidedExample: {
    operand1: 74, operand2: 38,
    steps: [
      { prompt: '74 − 30 =', answer: 44 },
      { prompt: '44 − 8 =', answer: 36 }
    ],
    compactThought: '"74 menos 30 = 44. 44 menos 8 = 36."'
  },

  simulatedPractice: {
    operand1: 92, operand2: 47,
    steps: [
      { prompt: '92 − 40 =', answer: 52 },
      { prompt: '52 − 7 =', answer: 45 }
    ],
    successMessage: 'Decomposição do subtraendo executada corretamente.'
  },

  commonError: {
    wrongProblem: { operand1: 85, operand2: 34, wrongAnswer: 41 },
    errorStep: 'Subtraiu 85 − 30 = 55, depois 55 − 4 = 51 — mas informou 41 (confundiu dezena com unidade) (✗)',
    errorExplanation: '85 − 34: subtrai dezenas primeiro (85−30=55), depois unidades (55−4=51). Resultado correto: 51.',
    cognitiveAnchor: '"Decompu o subtraendo em dezenas e unidades?"'
  },

  calibration: {
    operand1: 203, operand2: 87, answer: 116,
    steps: [
      { prompt: '203 − 80 =', answer: 123 },
      { prompt: '123 − 7 =', answer: 116 }
    ]
  }
}
```

#### Conceito 8 — Multiplicação por 10 e 100

```typescript
{
  conceptId: 8,

  hook: {
    problem: { operand1: 248, operand2: 100, operation: 'multiplication' },
    answer: 24800,
    visualHint: '248 → dois zeros adicionados → 24800'
  },

  intuition: {
    lines: [
      'Multiplicar por 10 desloca o valor uma casa decimal para a esquerda.',
      'Multiplicar por 100 desloca duas casas.',
      'Acrescentar zeros é a representação visual desse deslocamento.'
    ],
    keyEquation: 'n × 10^k = n seguido de k zeros',
    comprehensionQuestion: {
      question: 'O que significa multiplicar por 10 em termos de posição decimal?',
      options: [
        'Desloca todos os algarismos uma posição à esquerda',
        'Duplica o valor de cada dígito',
        'Adiciona 10 ao número'
      ],
      correctIndex: 0,
      explanation: 'Cada posição à esquerda multiplica por 10. Por isso ×10 desloca uma posição — equivalente a acrescentar um zero.'
    }
  },

  strategy: {
    innerVoice: ['36 vezes 100…', 'são duas casas à esquerda…', 'resultado: ___'],
    gapInputs: [
      { prompt: '36 × 10 =', answer: 360 },
      { prompt: '36 × 100 =', answer: 3600 }
    ]
  },

  guidedExample: {
    operand1: 36, operand2: 100,
    steps: [
      { prompt: '36 × 10 =', answer: 360 },
      { prompt: '360 × 10 = (ou 36 × 100) =', answer: 3600 }
    ],
    compactThought: '"36 → acrescento dois zeros → 3600."'
  },

  simulatedPractice: {
    operand1: 47, operand2: 100,
    steps: [
      { prompt: '47 × 100 =', answer: 4700 }
    ],
    successMessage: 'Deslocamento posicional executado. Estrutura reconhecida.'
  },

  commonError: {
    wrongProblem: { operand1: 75, operand2: 100, wrongAnswer: 750 },
    errorStep: 'Acrescentou apenas um zero (×10) em vez de dois (×100) (✗)',
    errorExplanation: '×100 = dois zeros. 75 × 100 = 7500. Confundir ×10 com ×100 é o erro mais frequente.',
    cognitiveAnchor: '"Contei o número correto de zeros?"'
  },

  calibration: {
    operand1: 248, operand2: 100, answer: 24800,
    steps: [
      { prompt: '248 × 100 =', answer: 24800 }
    ]
  }
}
```

---

## 6. Componentes de UI Necessários

### 6.1 `<TheoryPhase>` — Componente raiz da fase teórica

```typescript
interface TheoryPhaseProps {
  content: TheoryContent
  onComplete: (calibrationStatus: 'ok' | 'assisted') => void
}
```

Gerencia o estado interno `currentStep: TheorySubStep` e renderiza o sub-componente correspondente com `AnimatePresence`.

### 6.2 `<TheoryHook>` (T1)

Props: `hook`, `onComplete`
Interação: estimativa inicial + feedback imediato + hint visual animado

### 6.3 `<TheoryIntuition>` (T2)

Props: `intuition`, `onComplete`
Interação: revelação progressiva de linhas + múltipla escolha de compreensão

### 6.4 `<TheoryStrategy>` (T3)

Props: `strategy`, `onComplete`
Interação: typewriter do pensamento interno + inputs de lacuna sequenciais

### 6.5 `<TheoryGuidedExample>` (T4)

Props: `guidedExample`, `onComplete`
Interação: revelar passo por passo com tap + input por etapa (reutiliza lógica do `GuidedStepInput`)

### 6.6 `<TheorySimulated>` (T5)

Props: `simulatedPractice`, `onComplete`
Interação: problema com passos visíveis como lembrete + inputs de etapa

### 6.7 `<TheoryCommonError>` (T6)

Props: `commonError`, `onComplete`
Interação: identificação de erro (sim/não) + âncora cognitiva em destaque

### 6.8 `<TheoryCalibration>` (T7)

Props: `calibration`, `onComplete(status)`
Interação: input único → se errar, muda para inputs de etapa guiados → retorna status

---

## 7. Padrões de Interação e Animação

### 7.1 Transição entre sub-passos

- Cada sub-passo entra com `opacity: 0, y: 12` → `opacity: 1, y: 0` (200ms, ease out)
- Saída com `opacity: 0, y: -12` (150ms)
- Padrão idêntico ao já usado nos blocos de prática — sem criar nova linguagem visual

### 7.2 Revelação progressiva de texto

Linhas de `intuition.lines` e `strategy.innerVoice` reveladas uma por vez:
- Linha anterior: `color: var(--nm-text-dimmed)`
- Linha atual: `color: var(--nm-text-high)`, leve `scale: 1.02`
- Delay entre linhas: 900ms (automático) ou após tap do usuário (modo avançado)

### 7.3 Inputs de lacuna

Reutilizam `<InputField>` existente. Quando `disabled` (antes da vez do usuário), aparecem como `___` sublinhado em `var(--nm-text-dimmed)`.

Após acerto: input vira texto estático em `var(--nm-accent-stability)` e próximo input ativa.

Após erro: input vibra (animação `x: [-4, 4, -4, 0]`), mostra resposta correta em `var(--nm-accent-error)`, e avança automaticamente após 1.5s.

### 7.4 Âncora cognitiva (T6)

A frase de âncora (ex: `"Já tirei a metade?"`) recebe tratamento visual especial:
- Fundo: `var(--nm-bg-surface)` com borda `var(--nm-accent-primary)`
- Tipografia: `font-[family-name:var(--font-data)]` uppercase
- Animação de entrada: scale de 0.9 → 1.0 com fade (300ms)

No Bloco 4 (Consolidação), a âncora reaparece como badge retrátil no canto superior:
- Visível nos primeiros 2 problemas
- Após o 3.º problema: badge colapsa com animação (não some abruptamente)
- O usuário pode tocar para expandir a qualquer momento

---

## 8. Gestão de Estado e Dados

### 8.1 Tipo `TheoryContent`

Novo arquivo: `src/data/theoryContent.ts`
Exporta `THEORY_CONTENT: TheoryContent[]` e função `getTheoryContent(conceptId: number): TheoryContent | null`

### 8.2 Extensão de `LessonContent`

Adicionar campo opcional em `src/types/lesson.ts`:

```typescript
export interface LessonContent {
  // ... campos existentes ...
  theory?: TheoryContent  // undefined para conceitos sem conteúdo teórico ainda implementado
}
```

Isso permite rollout gradual: conceitos sem `theory` pulam diretamente para o `StepBlock` atual (compatibilidade retroativa).

### 8.3 Extensão de `useSession`

Adicionar ao estado da sessão:

```typescript
interface SessionState {
  // ... existente ...
  theoryCompleted: boolean
  calibrationStatus: 'ok' | 'assisted' | null
}
```

`theoryCompleted` é setado como `true` quando `TheoryPhase.onComplete` é chamado.

### 8.4 Registro no banco

Não criar novas tabelas. Usar o campo `metadata` da sessão (se existir) ou adicionar ao payload de `complete_session`:

```typescript
// Adição ao payload JSON da RPC complete_session
{
  theory_completed: boolean,
  calibration_status: 'ok' | 'assisted' | null
}
```

Isso permite análises futuras de correlação entre completar a fase teórica e desempenho na prática.

---

## 9. Plano de Implementação

### Fase 0 — Infraestrutura de dados (1 sprint)

**Entregáveis:**
1. Tipo `TheoryContent` em `src/types/lesson.ts`
2. Arquivo `src/data/theoryContent.ts` com conteúdo dos 8 conceitos Foundational
3. Função `getTheoryContent(conceptId)`
4. Testes unitários de validação dos dados (todas as respostas corretas são números válidos, fluxo completo navegável)

**Critério de conclusão:** `getTheoryContent(1)` retorna objeto válido com todos os 7 sub-passos populados. Nenhuma resposta é `NaN` ou `0`.

### Fase 1 — Componentes de UI (1-2 sprints)

**Entregáveis:**
1. `<TheoryHook>` (T1)
2. `<TheoryIntuition>` (T2) com múltipla escolha
3. `<TheoryStrategy>` (T3) com typewriter + lacunas
4. `<TheoryGuidedExample>` (T4)
5. `<TheorySimulated>` (T5)
6. `<TheoryCommonError>` (T6) com âncora cognitiva
7. `<TheoryCalibration>` (T7) com lógica de status
8. `<TheoryPhase>` orquestrando T1-T7

**Critério de conclusão:** Navegar manualmente pelo fluxo T1→T7 para conceito 1 sem erros de runtime. Transições animadas funcionando. Âncora cognitiva reaparece no Bloco 4.

### Fase 2 — Integração em `LessonExecution.tsx` (1 sprint)

**Entregáveis:**
1. Substituir `StepBlock` (Block 2) por `TheoryPhase` quando `theory !== undefined`
2. Fallback para `StepBlock` quando `theory === undefined` (retrocompatibilidade)
3. Barra de progresso atualizada para incluir sub-passos teóricos
4. Label do header exibindo `TEORIA_X/7` durante a fase
5. Estado `theoryCompleted` e `calibrationStatus` em `useSession`
6. Âncora cognitiva no Bloco 4 (badge retrátil após 2 problemas)

**Critério de conclusão:** Aula 1 do Conceito 1 flui completamente de T1 a B6 sem quebra de estado. Status `calibration_status` chega ao payload de `complete_session`.

### Fase 3 — Conteúdo e QA (1 sprint)

**Entregáveis:**
1. Validação pedagógica de todos os 8 `TheoryContent` por conceito Foundational
2. Teste de usabilidade com 3 usuários internos (fluxo completo, medir tempo por sub-passo)
3. Ajuste de timings de revelação progressiva baseado em feedback
4. Instrumentação: eventos de analytics para cada sub-passo completado

**Critério de conclusão:** Nenhum usuário de teste ficou confuso em T1-T7 do Conceito 1. Tempo médio da fase teórica entre 3 e 6 minutos.

---

## 10. Critérios de Aceite (Definition of Done)

1. **Fluxo completo:** Clicar em "Iniciar Aula 1" de qualquer conceito Foundational leva o usuário por T1→T2→T3→T4→T5→T6→T7→B3→B4→B5→B6 sem salto.

2. **Sem leitura passiva:** Em nenhuma tela da fase teórica o usuário avança apenas clicando "próximo" sem executar uma micro-ação (input, escolha ou tap de revelação).

3. **Calibração funcional:** Se o usuário erra o desafio T7, o Bloco 4 começa com o problema de menor dificuldade da sequência de consolidação.

4. **Âncora cognitiva:** A frase de âncora definida em `T6.commonError.cognitiveAnchor` aparece como badge retrátil nos primeiros 2 problemas do Bloco 4 para o mesmo conceito.

5. **Retrocompatibilidade:** Conceitos sem `theory` (futuros conceitos de Consolidação e Pro) continuam usando o fluxo atual (`StepBlock`) sem erros.

6. **Persistência:** `theoryCompleted: true` e `calibrationStatus` chegam ao banco ao finalizar a sessão.

7. **Performance:** Fase teórica completa carrega em < 1s (dados estáticos, sem chamadas de rede).

8. **Mobile-first:** Todos os componentes T1-T7 funcionam em viewport 375px sem overflow horizontal ou texto cortado.

---

## 11. Métricas de Sucesso

| Métrica | Linha base (atual) | Meta após implementação |
|---|---|---|
| Status `unstable` na 1.ª sessão de um conceito novo | ~40% | < 25% |
| Tempo no primeiro erro do Bloco 4 | problema 1-2 | problema 3+ |
| % sessões com `theory_completed: true` | 0% | > 85% (de quem inicia a aula) |
| Drop-off durante a fase teórica | — | < 15% |
| Tempo médio na fase teórica | — | 3-6 min (indicador de engajamento) |

---

## 12. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Fase teórica longa desmotiva o usuário | Média | Alto | Máximo 7 sub-passos; cada um < 60s; progresso visual claro durante toda a fase |
| Conteúdo de `TheoryContent` com erros pedagógicos | Baixa | Alto | Revisão manual de cada resposta antes de merge; testes unitários de validação |
| Quebra de retrocompatibilidade para conceitos sem `theory` | Baixa | Médio | Campo `theory?` é opcional; guard `if (!theory) return <StepBlock>` |
| `calibrationStatus` não chegar ao banco | Baixa | Baixo | Campo não crítico para progressão; falhar silenciosamente sem impacto no fluxo |
| Usuário pular fase teórica por impaciência | Média | Médio | Não há botão "pular" — cada sub-passo exige input. Somente na T1 há opção alternativa que mantém o fluxo |

---

## 13. Decisões de Design Explícitas

1. **Não há botão "pular fase teórica"** na Aula 1. A filosofia "aprende antes de praticar" é estrutural, não opcional. Nas Aulas 2 e 3 (Compressão e Ritmo), não há fase teórica — apenas prática.

2. **A âncora cognitiva não é um popup.** É um badge fixo, retrátil, não intrusivo. O usuário o vê mas não é interrompido por ele.

3. **O desafio T7 não é uma "porta de entrada" bloqueante.** Mesmo com `calibration_status: 'assisted'`, o usuário entra na prática — apenas com um primeiro problema mais simples. Ninguém é barrado.

4. **Inputs de lacuna não têm tentativas ilimitadas.** Após 2 erros no mesmo input, o sistema completa automaticamente e avança. Isso mantém o momentum pedagógico sem punir.

5. **O conteúdo teórico é estático, não gerado dinamicamente.** `TheoryContent` vive em `lessonContent.ts` como dados revisados manualmente. Não há geração algorítmica — qualidade pedagógica acima de escalabilidade automática.
