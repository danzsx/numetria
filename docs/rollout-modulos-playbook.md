# Playbook - Rollout Controlado de Modulos (Fase 5)

## Objetivo
Liberar modulos de conceitos em ondas, com rollback imediato por feature flag.

## Flags de Rollout

### Onda global
- `VITE_MODULE_ROLLOUT_WAVE=0`: nenhum modulo liberado.
- `VITE_MODULE_ROLLOUT_WAVE=1`: `foundational`.
- `VITE_MODULE_ROLLOUT_WAVE=2`: `foundational`, `consolidation`.
- `VITE_MODULE_ROLLOUT_WAVE=3`: `foundational`, `consolidation`, `automacao`, `ritmo`, `precisao`.

### Overrides por modulo
- `VITE_FF_MODULE_FOUNDATIONAL`
- `VITE_FF_MODULE_CONSOLIDATION`
- `VITE_FF_MODULE_AUTOMACAO`
- `VITE_FF_MODULE_RITMO`
- `VITE_FF_MODULE_PRECISAO`

Valores aceitos: `true/false`, `1/0`, `on/off`.

## Ordem de Liberacao (Ondas)
1. Onda 1: `foundational`.
2. Onda 2: `consolidation`.
3. Onda 3: `automacao`, `ritmo`, `precisao`.

## Procedimento Operacional
1. Definir onda no ambiente alvo via `VITE_MODULE_ROLLOUT_WAVE`.
2. Fazer deploy.
3. Validar smoke:
   - `/modules` mostra apenas modulos ativos.
   - `/modules/:moduleId` de modulo inativo mostra estado de rollout controlado.
   - `Dashboard` nao recomenda modulo inativo em "Continuar trilha".
4. Monitorar 7 dias os KPIs da Fase 4.

## Rollback (< 10 minutos)
1. Identificar modulo com incidente.
2. Desativar modulo por override (`VITE_FF_MODULE_<MODULO>=false`) ou reduzir onda.
3. Fazer redeploy.
4. Revalidar smoke:
   - modulo sai da listagem.
   - acesso direto a `/modules/:moduleId` fica bloqueado.
   - "Continuar trilha" nao aponta para modulo desativado.
5. Registrar timestamp e causa no log de incidente.

## Exemplo de Rollback Pontual
Incidente no modulo `ritmo`, mantendo demais da onda 3:
- `VITE_MODULE_ROLLOUT_WAVE=3`
- `VITE_FF_MODULE_RITMO=false`

## Escopo da Implementacao em Codigo
- Resolucao de flags: `src/app/utils/moduleFlags.ts`
- Selecao da proxima acao sem modulo inativo: `src/app/utils/moduleContext.ts`
- Listagem/detalhe de modulos sob flag: `src/app/pages/Modules.tsx`
- Dashboard sob flag: `src/app/pages/Dashboard.tsx`
