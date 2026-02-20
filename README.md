# NUMETRIA

Plataforma freemium de performance cognitiva focada em cálculo mental estruturado.

## Visão Geral

Numetria é um ambiente privado de treino mental baseado em método, mensuração e progressão técnica. A estética transmite luxo silencioso, precisão técnica e controle cognitivo.

**Arquétipo:** Mentor silencioso  
**Tom de voz:** Direto, técnico, preciso, contido

## Estrutura do Projeto

```
src/
├── app/
│   ├── components/
│   │   ├── ActionButton.tsx      # Botões primary e ghost
│   │   ├── BlueprintCard.tsx     # Card técnico com labels
│   │   ├── Footer.tsx            # Rodapé minimalista
│   │   ├── Header.tsx            # Cabeçalho com navegação
│   │   ├── InputField.tsx        # Input com feedback visual
│   │   └── MobileNav.tsx         # Bottom navigation mobile
│   ├── pages/
│   │   ├── Dashboard.tsx         # Dashboard com métricas
│   │   ├── History.tsx           # Histórico e gráficos
│   │   ├── Landing.tsx           # Landing page pública
│   │   ├── Modules.tsx           # Lista e detalhe de módulos
│   │   ├── Pro.tsx               # Página de upgrade
│   │   └── Training.tsx          # Experiência core de treino
│   ├── App.tsx                   # Root component
│   └── routes.tsx                # Configuração de rotas
└── styles/
    ├── fonts.css                 # Inter + JetBrains Mono
    ├── index.css                 # Imports principais
    ├── tailwind.css              # Tailwind base
    └── theme.css                 # Sistema de cores Numetria
```

## Design System

### Paleta de Cores

**Base:**
- Background principal: `#121417`
- Surface / Cards: `#1A1F24`
- Grid lines: `rgba(154, 166, 178, 0.08)`

**Accent:**
- Primary Focus: `#3A72F8` (ações principais)
- Stability Green: `#4DBA87` (estabilidade consolidada)
- Cold Error: `#5A6675` (erro neutro)

**Texto:**
- High contrast: `#E7EDF3`
- Dimmed: `#9AA6B2`
- Annotation: `rgba(154, 166, 178, 0.5)`

### Tipografia

**Hybrid Cognitive Layering**

- **Prose:** Inter (corpo de texto, UI)
- **Data:** JetBrains Mono (números, código, labels técnicos)

**Escala:**
- Hero Number: 80px (desktop) / 64px (tablet) / 48px (mobile)
- Body: 16px, line-height 1.6
- Blueprint Label: 10px, uppercase, tracking 0.15em

### Geometria

- Base unit: 4px
- Container max width: 720px
- Radius técnico: 4px
- Bordas: 1px solid (divisões) / 2px solid (foco)

## Páginas Principais

### 1. Landing (/)
Página pública com:
- Hero section com headline principal
- Quatro pilares do sistema
- Explicação do método
- Comparativo Núcleo vs Pro

### 2. Dashboard (/dashboard)
Tela principal logada com:
- Métricas atuais (precisão, tempo, estabilidade, variação)
- Mapa de módulos com progresso
- Gráfico de histórico semanal

### 3. Training (/training)
Experiência core de treino:
- Número protagonista centralizado
- Input ghost com feedback técnico
- Modo foco (background escurecido)
- Sem gamificação emocional

### 4. Modules (/modules)
- Lista de módulos disponíveis
- Detalhamento de conceitos e aulas
- Sistema de 3 aulas: Estrutura, Compressão, Ritmo

### 5. History (/history)
- Gráficos de tendência (30 dias)
- Lista de sessões recentes
- Métricas detalhadas por sessão

### 6. Pro (/pro)
- Features do protocolo completo
- Pricing mensal vs anual
- Detalhes técnicos sem urgência artificial

## Interações

**Easing:** `cubic-bezier(0.2, 0.8, 0.2, 1)`

**Duração:**
- Instant: 150ms
- Standard: 250ms

**Microinterações:**
- Shake sutil em erro
- Transições suaves entre questões
- Desaturação rítmica para feedback

## Responsividade

**Breakpoints:**
- Mobile: 360px
- Tablet: 768px
- Desktop: 1280px

**Adaptações Mobile:**
- Bottom navigation fixa
- Hero number reduzido
- Menu colapsado no header
- Cards empilhados verticalmente

## Dados Mock

Atualmente a aplicação usa dados simulados para demonstração:
- Métricas de usuário
- Histórico de sessões
- Progresso em módulos
- Problemas de treino

## Próximos Passos: Integração com Supabase

Para transformar esta aplicação em um produto completo, recomenda-se integração com Supabase para:

### Funcionalidades Necessárias

1. **Autenticação de Usuários**
   - Sign up / Login
   - Gestão de sessões
   - Perfis de usuário

2. **Persistência de Dados**
   - Progresso em módulos
   - Histórico de treino
   - Métricas de performance
   - Sessões de treino completas

3. **Sistema Freemium**
   - Controle de acesso a módulos Pro
   - Gestão de assinaturas
   - Limites de histórico

4. **Análise de Performance**
   - Cálculo de métricas avançadas
   - Identificação de padrões
   - Recomendações personalizadas

### Estrutura de Dados Sugerida

**Tabelas principais:**

- `users` - Perfis de usuário
- `subscriptions` - Assinaturas Pro
- `modules` - Módulos de treino
- `concepts` - Conceitos dentro de módulos
- `lessons` - Aulas (Estrutura, Compressão, Ritmo)
- `training_sessions` - Sessões de treino
- `training_results` - Resultados individuais
- `user_progress` - Progresso do usuário

## Tecnologias

- React 18.3
- React Router 7.13
- Tailwind CSS 4.1
- Motion 12.23 (animações)
- Recharts 2.15 (gráficos)
- Lucide React (ícones)

## Princípios de Design

1. **Privacidade**: Ambiente pessoal, sem comparação social
2. **Silêncio**: Minimalismo visual, sem ruído
3. **Foco**: Prioridade ao número durante treino
4. **Controle**: Usuário no comando da progressão
5. **Técnica**: Linguagem precisa e mensurável
6. **Método**: Estrutura antes de velocidade

---

**Numetria é treino. Treino constrói precisão.**
