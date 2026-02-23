# PRD - Correcao de Dashboard, Fluxo e Conteudo Interativo dos Modulos

Status: Proposta
Data: 2026-02-22
Escopo: Todos os modulos de conceitos (Fundacional, Consolidacao, Automacao, Ritmo, Precisao). Excecao: Tabuada Estruturada (fluxo proprio).

## 1. Contexto

Com base em `docs/MOTOR PEDAGOGICO e CONTEUDO.md`, `docs/resumo-modulos-aulas.md`, `docs/ARQUITETURA-TECNICA.md` e no codigo atual, o produto possui tres gaps principais:

1. UX de entrada e navegacao: dashboard pouco convidativa, com fluxo de estudo pouco claro.
2. Navegacao pos-aula/modulo inconsistente: o usuario perde contexto do modulo atual ao finalizar sessao.
3. Conteudo interativo acoplado ao engine de tabuada: aulas de modulos de conceitos estao treinando padrao de tabuada (base x 1..10), em vez da tecnica mental de cada conceito.

Impacto direto:
- Baixa clareza de jornada.
- Baixa percepcao de progresso por modulo.
- Perda do objetivo pedagogico de ensinar calculo mental aplicado.

## 2. Problema de Produto

### 2.1 Problemas observados

1. Dashboard nao orienta "o que fazer agora".
2. O fluxo principal nao evidencia: modulo -> conceito -> aula -> proxima aula.
3. Em fluxo de treino guiado por modulo (`/tabuada/training?conceptId=...`), o resultado oferece retorno ao dashboard (`src/app/pages/TabuadaResult.tsx`), quebrando a continuidade do modulo.
4. Modos Estrutura, Compreensao/Compressao e Ritmo compartilham logica de exercicio similar em varios conceitos (foco em tabuada), sem diferenciar intencao pedagogica.
5. No exemplo de multiplicacao por 5 (Conception_01), os exercicios ainda sao majoritariamente do tipo `5 x n`, em vez de contas aplicadas como `478 x 5`, `1450 x 5`, `2478 x 5`.
6. O problema se repete nos demais modulos (nao apenas Fundacional), porque existe acoplamento estrutural ao motor de tabuada para aulas 2 e 3 e para parte da progressao.

### 2.2 Causa raiz

1. Acoplamento entre "motor de treino de tabuada" e "motor de aula de conceito".
2. Ausencia de um contrato de conteudo por aula/modo para todos os conceitos.
3. Fluxo de navegacao orientado por pagina generica de treino, e nao por trilha de aprendizado contextual.

## 3. Objetivos

## 3.1 Objetivo principal

Transformar os modulos de conceitos em trilhas pedagogicas independentes do treino de tabuada, com fluxo claro e conteudo interativo aderente ao objetivo de calculo mental por tecnica.

## 3.2 Objetivos especificos

1. Tornar dashboard e pagina de modulo orientadas por "proxima acao".
2. Garantir retorno pos-aula para a pagina do modulo/conceito (nunca perder contexto).
3. Separar tecnicamente o motor de aulas dos modulos do motor de tabuada.
4. Redesenhar conteudo dos 3 modos para todos os conceitos:
- Estrutura: ensino da tecnica.
- Compreensao: treino de entendimento e aplicacao da tecnica.
- Ritmo: treino cronometrado da mesma tecnica.
5. Atualizar bancos de questoes para contas aplicadas e desafiadoras (nao tabuada simples), respeitando progressao por modulo.

## 4. Nao objetivos (fora deste PRD)

1. Redesenho completo de identidade visual da marca.
2. Mudanca de precificacao/produto Pro.
3. Reescrita total do engine de Tabuada Estruturada.

## 5. Principios de desenho (alinhados ao @docs)

1. Estrutura antes de velocidade.
2. Cada modo tem intencao pedagogica distinta e observavel.
3. Erro tratado como dado tecnico (feedback por etapa).
4. Progressao contextual: sempre manter usuario dentro do modulo/conceito.
5. Medicao orientada a decisao: progresso, estabilidade e proxima acao claros.

## 6. Solucao proposta

## 6.1 Frente A - UX e Fluxo

### A.1 Dashboard orientada por acao

Implementar bloco principal "Continuar trilha" com:
1. Modulo atual.
2. Conceito atual.
3. Aula recomendada (Estrutura/Compreensao/Ritmo).
4. CTA unico: "Continuar de onde parei".

### A.2 Pagina de modulo como hub principal

Em cada modulo:
1. Mostrar mapa de conceitos com status e proxima aula destacada.
2. Exibir breadcrumb fixo (`Modulos > [Modulo] > [Conceito] > [Aula]`).
3. Exibir CTA contextual no resultado: "Voltar para [Modulo]" e "Iniciar proxima aula".

### A.3 Regra de retorno pos-aula

Ao finalizar uma aula de modulo:
1. Se existir proxima aula desbloqueada no mesmo conceito: sugerir iniciar imediatamente.
2. Se conceito concluir: retornar para pagina do modulo (`/modules/:moduleId`) com foco no conceito concluido/proximo.
3. Nunca redirecionar para dashboard por padrao em fluxo de modulo.

## 6.2 Frente B - Desacoplamento do motor de conteudo

Criar separacao explicita:
1. `TabuadaEngine`: apenas modulo Tabuada Estruturada.
2. `ConceptLessonEngine`: aulas de conceitos (todos os modulos).

Contrato minimo do `ConceptLessonEngine`:
1. Entrada: `moduleId`, `conceptId`, `lessonNumber`, `mode`, `difficultyTier`, `adaptiveProfile`.
2. Saida: `lessonPlan`, `questionSet`, `feedbackRules`, `timerPolicy`.
3. Persistencia: registrar `concept_id`, `lesson_number`, `mode` e `module_id` em todas as sessoes.

## 6.3 Frente C - Modelo pedagogico unico para todos os conceitos

Para cada conceito, padronizar:

1. Modo Estrutura
- Explica o macete/algoritmo mental.
- Exige etapas intermediarias.
- Sem cronometro.
- Critico de aceite: usuario consegue explicar e executar o algoritmo.

2. Modo Compreensao
- Exercicios de aplicacao variada da tecnica.
- Menos suporte visual.
- Sem cronometro obrigatorio.
- Critico de aceite: usuario aplica a tecnica em diferentes formatos de numeros.

3. Modo Ritmo
- Mesma tecnica, com cronometro ativo.
- Feedback focado em estabilidade de tempo + precisao.
- Critico de aceite: manter limiar minimo de precisao sob tempo.

## 6.4 Frente D - Redesign de banco de questoes (todos os modulos)

Regra global:
- Proibido usar apenas padrao de tabuada (ex.: `5 x 7`, `5 x 8`) como nucleo da aula de conceito.
- Obrigatorio incluir contas aplicadas por faixa de dificuldade.

Exemplo obrigatorio para conceito "Multiplicacao por 5":
1. Estrutura: ensinar `n x 5 = (n x 10) / 2` com exemplos como `2478 x 5`.
2. Compreensao: lista variada (`478 x 5`, `1450 x 5`, `903 x 5`, `12006 x 5`).
3. Ritmo: mesma familia de contas com cronometro.

A mesma logica deve ser replicada para todos os conceitos de todos os modulos (exceto Tabuada Estruturada).

## 7. Requisitos funcionais

## 7.1 Navegacao e fluxo

1. Toda sessao iniciada de `/modules/:moduleId` deve retornar ao contexto do modulo.
2. Resultado deve mostrar botao primario de continuidade da trilha atual.
3. Dashboard deve possuir CTA unico de continuidade.

## 7.2 Conteudo por aula

1. Cada conceito deve ter 3 aulas com objetivos e bancos distintos.
2. Cada aula deve ter validacao de aprendizado compativel com o modo.
3. Questoes devem refletir tecnica mental aplicada, nao memorizacao de tabuada.

## 7.3 Independencia entre modulos

1. Fluxo de conceitos nao pode depender de `generateProblems` do engine de tabuada.
2. Configuracoes adaptativas devem ser por conceito/modo, nao por base de tabuada.

## 8. Requisitos nao funcionais

1. Tempo de carregamento por aula < 2s em condicoes normais.
2. Sem regressao de persistencia de progresso (`concept_progress` e sessoes).
3. Compatibilidade mobile e desktop mantida.

## 9. Plano de execucao (fases)

## Fase 0 - Diagnostico e especificacao de conteudo (1 sprint)

1. Mapear todos os conceitos por modulo e identificar itens com dependencia de tabuada.
2. Definir matriz pedagogica por conceito:
- tecnica mental,
- tipos de questao por modo,
- niveis de dificuldade.
3. Definir contrato tecnico do `ConceptLessonEngine`.

Entregavel:
- planilha/JSON mestre de conteudo por conceito e modo.

## Fase 1 - Fluxo e navegacao (1 sprint)

1. Ajustar retorno pos-aula para pagina de modulo.
2. Implementar CTA de continuidade no resultado.
3. Reestruturar dashboard com bloco "Continuar trilha".

Entregavel:
- fluxo continuo sem salto para dashboard em trilha de modulo.

## Fase 2 - Desacoplamento tecnico (1-2 sprints)

1. Extrair logica de aulas de conceito para `ConceptLessonEngine`.
2. Manter `TabuadaEngine` somente para Tabuada Estruturada.
3. Atualizar roteamento e factories de questao por modulo.

Entregavel:
- independencia arquitetural entre modulo de tabuada e modulos de conceitos.

## Fase 3 - Migracao de conteudo de todos os modulos (2-4 sprints)

1. Reescrever banco de questoes dos conceitos Fundacional e Consolidacao.
2. Reescrever banco de questoes dos conceitos Automacao, Ritmo e Precisao.
3. Garantir variacao de numeros e progressao de dificuldade por modo.

Entregavel:
- 100% dos conceitos com conteudo aderente ao modelo Estrutura/Compreensao/Ritmo.

## Fase 4 - Validacao pedagogica + QA (1-2 sprints)

1. Testes de regressao de progresso e desbloqueio.
2. Testes de usabilidade com foco em clareza de fluxo.
3. Testes pedagogicos por amostra de conceitos por modulo.

Entregavel:
- release candidate com cobertura funcional e pedagogica.

## 10. Criterios de aceite (Definition of Done)

1. Nenhuma aula de modulos (exceto Tabuada Estruturada) usa banco principal de tabuada simples como nucleo do treino.
2. Em todos os modulos, os 3 modos possuem comportamento diferente e observavel.
3. Ao finalizar aula de modulo, usuario volta ao modulo/conceito (nao dashboard por padrao).
4. Dashboard mostra "Continuar trilha" com proxima acao clara.
5. Para conceito de multiplicacao por 5, existem exercicios aplicados com numeros de 3 a 5 digitos em Compreensao e Ritmo.
6. Persistencia continua registrando corretamente `concept_id` e `lesson_number`.

## 11. KPI e observabilidade

1. Fluxo:
- `% de sessoes que retornam para modulo apos resultado` (meta: >= 95%).
- `% de usuarios que clicam em "Continuar trilha" no dashboard`.

2. Conteudo:
- `% de questoes aplicadas vs tabuada simples por conceito` (meta: >= 80% aplicadas em modulos de conceitos).
- `delta de precisao entre Estrutura -> Compreensao -> Ritmo` por conceito.

3. UX:
- `drop-off no resultado sem proxima acao` (meta: reduzir em >= 30%).

## 12. Riscos e mitigacoes

1. Risco: migracao de conteudo quebrar progressao.
- Mitigacao: feature flag por modulo + rollout gradual.

2. Risco: inconsistencias entre docs e taxonomia atual de conceitos.
- Mitigacao: consolidar dicionario unico de conceitos antes da Fase 2.

3. Risco: aumento de complexidade no motor de aula.
- Mitigacao: contratos pequenos, testes unitarios de geracao e feedback.

## 13. Backlog priorizado (P0/P1/P2)

P0:
1. Corrigir retorno pos-aula para contexto de modulo.
2. CTA "Continuar trilha" no dashboard.
3. Separar engine de conceitos do engine de tabuada.

P1:
1. Migrar conteudo Fundacional + Consolidacao para modelo aplicado.
2. Migrar conteudo Automacao + Ritmo + Precisao.
3. Instrumentar KPI de fluxo e conteudo.

P2:
1. Refinar adaptatividade por modo.
2. Otimizar UX de feedback tecnico por tipo de erro.

## 14. Decisao de escopo final

Este PRD define que a correcao e obrigatoria para todos os modulos de conceitos (Fundacional, Consolidacao, Automacao, Ritmo e Precisao), mantendo Tabuada Estruturada como trilha independente e sem contaminar o conteudo pedagogico dos demais.
