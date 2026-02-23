# SPEC: Correcao de Modulos Interativos (Faseado)
**Versao**: 1.0 | **Data**: 2026-02-22 | **Status**: Pronto para execucao

## 1. Objetivo

Implementar a correcao dos modulos de conceitos (Fundacional, Consolidacao, Automacao, Ritmo, Precisao), garantindo:

1. Fluxo continuo modulo -> conceito -> aula -> proxima aula.
2. Retorno pos-aula para contexto do modulo (sem salto padrao para dashboard).
3. Separacao tecnica entre treino de Tabuada Estruturada e aulas de conceitos.
4. Conteudo interativo aderente a tecnica mental por modo (Estrutura, Compreensao, Ritmo).

Excecao de escopo: Tabuada Estruturada permanece com fluxo proprio.

## 2. Escopo Tecnico

### Incluido
1. UX de dashboard e paginas de modulo orientadas a "proxima acao".
2. Regra de navegacao pos-resultado contextual por modulo/conceito.
3. `ConceptLessonEngine` separado do `TabuadaEngine`.
4. Contrato de conteudo por conceito/mode com banco de questoes aplicado.
5. Instrumentacao minima para medir continuidade de fluxo e aderencia pedagogica.

### Fora de Escopo
1. Rebranding completo.
2. Alteracoes de preco/plano Pro.
3. Reescrita total do engine de Tabuada Estruturada.

## 3. Premissas e Dependencias

1. A taxonomia de conceitos/modulos sera consolidada antes da migracao de conteudo.
2. O backend atual de sessao/progresso ja persiste `concept_id`, `module_id`, `lesson_number` (ou sera ajustado na Fase 2).
3. O roteamento de modulos (`/modules/:moduleId`) e treino (`/tabuada/training`) sera mantido.
4. Feature flag por modulo sera usada para rollout seguro.

## 4. Estrategia de Implementacao por Fases

## Fase 0 - Diagnostico e Contratos (1 sprint)
**Objetivo:** travar contrato de conteudo e mapear acoplamentos atuais.

### Entregas
1. Inventario de todos os conceitos por modulo com status de dependencia do engine de tabuada.
2. Matriz pedagogica por conceito:
- tecnica mental
- tipos de questao por modo
- niveis de dificuldade
- criterios de aprovacao por modo
3. Contrato formal do `ConceptLessonEngine`:
- input: `moduleId`, `conceptId`, `lessonNumber`, `mode`, `difficultyTier`, `adaptiveProfile`
- output: `lessonPlan`, `questionSet`, `feedbackRules`, `timerPolicy`

### Criterios de aceite
1. 100% dos conceitos mapeados.
2. Documento de contrato aprovado por produto + engenharia.
3. Lista de gaps tecnicos priorizada (P0/P1/P2).

## Fase 1 - Fluxo e Navegacao (1 sprint)
**Objetivo:** remover quebra de contexto no estudo por modulo.

### Entregas
1. Dashboard com bloco principal "Continuar trilha":
- modulo atual
- conceito atual
- proxima aula recomendada
- CTA unico "Continuar de onde parei"
2. Resultado de aula com CTA primario contextual:
- "Iniciar proxima aula" quando houver proxima aula desbloqueada
- "Voltar para [Modulo]" como opcao secundaria
3. Regra de retorno pos-aula:
- origem em `/modules/:moduleId` retorna para contexto do modulo
- nao redirecionar para dashboard por padrao

### Criterios de aceite
1. Fluxo de modulo nao perde contexto apos finalizar aula.
2. Dashboard mostra proxima acao unica para usuario ativo.
3. Breadcrumb exibido em jornada de modulo: `Modulos > [Modulo] > [Conceito] > [Aula]`.

## Fase 2 - Desacoplamento Tecnico (1-2 sprints)
**Objetivo:** separar motor de aulas de conceito do motor de tabuada.

### Entregas
1. Criacao do `ConceptLessonEngine` com factories por modo.
2. `TabuadaEngine` restrito a Tabuada Estruturada.
3. Refatoracao de roteamento/factory para usar engine correto por contexto.
4. Persistencia de sessoes garantindo `module_id`, `concept_id`, `lesson_number`, `mode`.

### Criterios de aceite
1. Conceitos nao dependem de `generateProblems` da tabuada.
2. Sessao iniciada de modulo usa exclusivamente `ConceptLessonEngine`.
3. Sem regressao em progresso/desbloqueio.

## Fase 3 - Migracao de Conteudo (2-4 sprints)
**Objetivo:** trocar bancos de questoes de todos os conceitos para treino aplicado.

### Entregas
1. Pacote 3A: Fundacional + Consolidacao.
2. Pacote 3B: Automacao + Ritmo + Precisao.
3. Cada conceito com 3 aulas distintas:
- Estrutura: ensina algoritmo mental, com etapas intermediarias, sem cronometro.
- Compreensao: aplicacao variada da tecnica, menos suporte visual.
- Ritmo: mesma tecnica sob tempo, com metricas de estabilidade.
4. Regra global de questoes:
- proibido nucleo baseado so em tabuada simples (`base x 1..10`)
- obrigatorio incluir contas aplicadas e variacao numerica por dificuldade

### Exemplo obrigatorio (Multiplicacao por 5)
1. Estrutura: `n x 5 = (n x 10) / 2` com casos como `2478 x 5`.
2. Compreensao: `478 x 5`, `1450 x 5`, `903 x 5`, `12006 x 5`.
3. Ritmo: mesma familia de contas com cronometro.

### Criterios de aceite
1. 100% dos conceitos migrados (exceto Tabuada Estruturada).
2. Diferenca de comportamento observavel entre os 3 modos.
3. Cobertura minima de questoes aplicadas por conceito >= 80%.

## Fase 4 - Validacao Pedagogica e QA (1-2 sprints)
**Objetivo:** validar qualidade funcional, pedagogica e de UX.

### Entregas
1. Suite de regressao de progresso/desbloqueio.
2. Testes de fluxo ponta a ponta (dashboard -> modulo -> aula -> resultado -> proxima acao).
3. Validacao pedagogica por amostra representativa de conceitos.
4. Telemetria dos KPIs do PRD.

### Criterios de aceite
1. `% sessoes que retornam ao modulo apos resultado` >= 95%.
2. Reducao de `drop-off no resultado sem proxima acao` >= 30%.
3. Sem regressao de persistencia de `concept_progress` e sessoes.
4. Tempo de carregamento por aula < 2s em condicoes normais.

## Fase 5 - Rollout Controlado (1 sprint continuo, paralelo a Fase 4)
**Objetivo:** liberar sem risco operacional.

### Entregas
1. Feature flags por modulo (`fundacional`, `consolidacao`, `automacao`, `ritmo`, `precisao`).
2. Rollout em ondas:
- onda 1: Fundacional
- onda 2: Consolidacao
- onda 3: Automacao/Ritmo/Precisao
3. Playbook de rollback por flag.
4. Documento operacional: `docs/rollout-modulos-playbook.md`.

### Criterios de aceite
1. Rollback por modulo executavel em menos de 10 minutos.
2. Nenhum incidente critico aberto por 7 dias apos onda 3.

## 5. Backlog de Implementacao (Priorizado)

### P0
1. Regra de retorno pos-aula para contexto de modulo.
2. CTA unico "Continuar trilha" no dashboard.
3. Contrato + bootstrap do `ConceptLessonEngine`.

### P1
1. Migracao de conteudo Fundacional + Consolidacao.
2. Migracao de conteudo Automacao + Ritmo + Precisao.
3. Instrumentacao de KPIs de fluxo e conteudo.

### P2
1. Refino adaptativo por modo.
2. Feedback tecnico por tipo de erro (estrutura x atencao x tempo).

## 6. Arquivos/Areas Provaveis de Mudanca

1. `src/app/pages/Dashboard.tsx`
2. `src/app/pages/Modules.tsx`
3. `src/app/pages/TabuadaTraining.tsx`
4. `src/app/pages/TabuadaResult.tsx`
5. `src/hooks/useSession.ts`
6. `src/app/utils/` (novo `ConceptLessonEngine` e factories)
7. `supabase/` (ajustes de persistencia, se necessario)
8. `docs/` (matriz pedagogica e catalogo de questoes)

## 7. Riscos e Mitigacoes

1. Risco: migracao de questoes quebrar progressao.
- Mitigacao: flags por modulo + rollout gradual + testes de regressao.
2. Risco: inconsistencia entre docs e taxonomia em codigo.
- Mitigacao: dicionario unico de conceitos aprovado na Fase 0.
3. Risco: aumento de complexidade do motor de aula.
- Mitigacao: contratos pequenos, testes unitarios por factory e por modo.

## 8. Definition of Done (Global)

1. Nenhuma aula de modulos de conceitos usa tabuada simples como nucleo.
2. Todos os conceitos possuem Estrutura/Compreensao/Ritmo com objetivo distinto e verificavel.
3. Finalizar aula em trilha de modulo sempre preserva contexto de modulo/conceito.
4. Dashboard apresenta acao unica de continuidade.
5. Persistencia registra corretamente `module_id`, `concept_id`, `lesson_number`, `mode`.
6. KPIs minimos de fluxo e conteudo ativos em ambiente de producao.
