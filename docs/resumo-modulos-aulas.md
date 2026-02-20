# Resumo Detalhado — Seção de Módulos das Aulas (Estado Atual do Projeto)

## 1. Escopo analisado
Este resumo foi produzido a partir da leitura cruzada de:

- Código frontend de módulos, treino e navegação (`src/app/pages/Modules.tsx`, `src/app/pages/Training.tsx`, `src/app/pages/Tabuada*.tsx`, `src/app/routes.tsx`, `src/app/pages/Dashboard.tsx`, `src/app/pages/History.tsx`)
- Hooks e serviços de dados (`src/hooks/useConceptProgress.ts`, `src/hooks/useSession.ts`, `src/services/session.service.ts`, `src/services/user.service.ts`, `src/services/adaptive.service.ts`)
- Tipos de banco (`src/types/database.ts`)
- Regras SQL de persistência/progressão (`supabase/migrations/002_phase2_sessions.sql`, `supabase/migrations/003_phase3_metrics.sql`, `supabase/migrations/004_phase4_adaptive.sql`)
- Documentação pedagógica e técnica (`docs/MOTOR PEDAGÓGICO e CONTEUDO.md`, `docs/ARQUITETURA-TECNICA.md`, `docs/Numetria-brand.md`, `README.md`)

---

## 2. Organização dos módulos (estrutura, hierarquia, sequência)

## 2.1 Estrutura de navegação
- Rota de lista: `/modules`
- Rota de detalhe: `/modules/:moduleId`
- Ambas são renderizadas pela mesma página (`Modules.tsx`), que decide entre lista e detalhe via `useParams()`.

## 2.2 Módulos expostos atualmente na UI
Na lista de módulos, existem 3 entradas:

1. `tabuada` (Tabuada Estruturada)
2. `foundational` (Fundacional)
3. `consolidation` (Consolidação)

## 2.3 Hierarquia de conceitos por módulo (implementada)
- `foundational`: conceitos com `concept_id` de 1 a 8
- `consolidation`: conceitos com `concept_id` de 9 a 15

Cada conceito é exibido com 3 aulas fixas:
1. Estrutura
2. Compressão
3. Ritmo

## 2.4 Sequência pedagógica esperada
A arquitetura prevista no projeto é sequencial:
- Conceito atual progride por aulas 1 → 2 → 3
- Ao completar conceito, desbloqueia o próximo conceito
- Progresso do módulo é agregado por percentual de conceitos concluídos/masterizados

---

## 3. Elementos que compõem cada módulo

## 3.1 Elementos visuais/funcionais no módulo de conceitos (`foundational`/`consolidation`)
Cada conceito exibe:
- Nome do conceito
- Badge de status do conceito (`locked`, `available`, `in_progress`, `completed`, `mastered`)
- Lista de 3 aulas com status individual (`locked`, `available`, `completed`)
- Botão `Iniciar` apenas para aula `available`
- Barra de progresso do conceito (0–100% por aulas concluídas)
- Métricas adicionais (quando houver dados):
  - Última precisão
  - Total de sessões
  - Indicador textual de próximo conceito desbloqueado

## 3.2 Elementos do módulo `tabuada`
Fluxo próprio em 3 telas:
1. Configuração (`/tabuada/setup`): operação, base, modo, ritmo e recomendação adaptativa
2. Execução (`/tabuada/training`): resolução das questões com feedback
3. Resultado (`/tabuada/result`): métricas da sessão e próximo passo adaptativo

## 3.3 Tipos de conteúdo realmente presentes
- Presente: treino interativo (questões), estados de progresso, métricas de precisão/tempo, feedback técnico
- Não identificado na implementação atual de módulos: videoaulas, textos didáticos longos, biblioteca de materiais de apoio, exercícios em formato não interativo (ex. PDF/lista textual)

---

## 4. Navegação e interação do usuário

## 4.1 Fluxo principal de navegação
1. Usuário entra em `/modules`
2. Seleciona um módulo
3. Em `foundational` ou `consolidation`, visualiza conceitos e aulas
4. Clica em `Iniciar` numa aula disponível
5. Atualmente é redirecionado para `/training`

## 4.2 Comportamento por tipo de módulo
- `tabuada`: fluxo consistente entre setup → treino → resultado
- `foundational`/`consolidation`: detalhe mostra aulas e botão `Iniciar`, mas inicia um treino genérico (`/training`) sem contexto explícito de `concept_id` e `lesson_number`

## 4.3 Interações de status
- Ícones mudam por status da aula (play/completed/locked)
- Cards/linhas têm opacidade e borda destacando disponibilidade
- Progresso visual por conceito e por módulo (percentual)

---

## 5. Regras de negócio e lógicas pedagógicas

## 5.1 Modelo de status de progresso
No banco (`concept_progress`), o conceito pode estar em:
- `locked`
- `available`
- `in_progress`
- `completed`
- `mastered`

Cada aula possui status próprio:
- `lesson_1_status`
- `lesson_2_status`
- `lesson_3_status`

## 5.2 Regras de progressão (SQL — Fase 4)
Na função RPC `complete_session`:
- Sessão com `session_status != 'unstable'` conta como aula concluída
- Concluir aula 1 desbloqueia aula 2
- Concluir aula 2 desbloqueia aula 3
- Concluir aula 3 define conceito como `mastered`
- Conceito `completed`/`mastered` pode desbloquear próximo conceito (`concept_id + 1`) com aula 1 disponível
- Há proteção para não regredir conceito já `completed`/`mastered`

## 5.3 Lógica adaptativa de treino
- Status da sessão é calculado por precisão e variabilidade temporal (`stable`, `consolidating`, `unstable`)
- `adaptive_level` global do usuário sobe/desce conforme estabilidade da sessão
- Recomendação adaptativa sugere combinação `mode` + `timer_mode` (níveis 1–4)

## 5.4 Pré-requisitos e liberação progressiva
- Pré-requisito implícito: sequência de aulas dentro do conceito
- Liberação progressiva: próxima aula/conceito desbloqueada por desempenho
- Relação Free/Pro prevista em docs e schema (conceitos até 24), mas a UI de módulos atualmente cobre sobretudo conceitos 1–15

---

## 6. Padrões, convenções e boas práticas observadas

## 6.1 Padrões de arquitetura
- Separação em camadas: `pages` + `hooks` + `services` + `types`
- Uso de RPC no banco para operações transacionais críticas (`complete_session`, `get_user_dashboard`, `get_adaptive_recommendation`)
- Tipagem forte em TypeScript alinhada ao schema

## 6.2 Padrões de UX para módulos
- Linguagem técnica consistente com o branding
- Progresso sempre visível (percentual e status)
- Estados de loading explícitos com `Loader`
- Navegação clara entre lista de módulos e detalhe

## 6.3 Boas práticas de dados/segurança
- RLS nas tabelas de progresso/sessão/métricas
- Escrita centralizada por função `SECURITY DEFINER` para manter atomicidade
- Persistência de sessão e métricas em estrutura analítica reutilizável no dashboard/histórico

---

## 7. Pontos de atenção para garantir consistência (críticos para próxima etapa)

## 7.1 Gap entre UI de módulos e persistência pedagógica
Hoje, o botão `Iniciar` das aulas em `Modules.tsx` navega para `/training` (treino genérico), que:
- Não usa `useSession`
- Não chama `sessionService.completeSession`
- Não persiste sessão no banco
- Não envia `concept_id` nem `lesson_number`

Impacto: a progressão pedagógica (aulas e desbloqueios) definida em SQL tende a não evoluir via fluxo atual dos módulos.

## 7.2 Gap no fluxo de tabuada e progresso por conceito
Mesmo no fluxo moderno de tabuada (`TabuadaTraining` + `useSession`):
- A sessão está sendo salva
- Mas `lesson_number` é enviado como `null`
- `concept_id` também não está sendo passado no fluxo padrão

Impacto: o backend não consegue aplicar corretamente progressão por aula/conceito nesse fluxo.

## 7.3 Divergências entre documentos e implementação
- Docs pedagógicos listam uma taxonomia de conceitos que não coincide 1:1 com os nomes atuais exibidos em `Modules.tsx`
- Existe indicação de 5 módulos (Fundacional, Consolidação, Automação, Ritmo, Precisão), mas a seção de módulos implementada com detalhe funcional está centrada em `tabuada`, `foundational`, `consolidation`
- `Tabuada Estruturada` aparece com `40` conceitos na UI, enquanto documentos referenciam totais por aulas/conceitos em outra lógica

## 7.4 Dependência de seed/estado inicial de progresso
A progressão depende de registros em `concept_progress`. Sem seed inicial explícito do primeiro conceito disponível, pode haver usuários sem trilha iniciada adequadamente.

---

## 8. Leitura consolidada para orientar próxima feature pedagógica

A seção de módulos já possui:
- Estrutura visual e hierárquica clara
- Modelo de status robusto
- Backend com regra de progressão e desbloqueio bem definido

Mas para uma nova feature de conteúdo pedagógico ficar coerente e totalmente integrada, será essencial alinhar o fluxo de execução de aulas com os identificadores pedagógicos (`concept_id`, `lesson_number`) no momento de iniciar/finalizar treino.

Em termos práticos, o projeto já tem o “modelo-alvo” correto no banco e na UI, porém a “costura” entre tela de módulos e sessão persistida ainda está parcial.

---

## 9. Referências rápidas (arquivos-chave)
- `src/app/pages/Modules.tsx`
- `src/hooks/useConceptProgress.ts`
- `src/app/pages/Training.tsx`
- `src/app/pages/TabuadaSetup.tsx`
- `src/app/pages/TabuadaTraining.tsx`
- `src/app/pages/TabuadaResult.tsx`
- `src/services/session.service.ts`
- `supabase/migrations/004_phase4_adaptive.sql`
- `docs/MOTOR PEDAGÓGICO e CONTEUDO.md`
