import type { ModuleId } from './moduleContext'

type RolloutWave = 0 | 1 | 2 | 3
type EnvLike = Record<string, unknown>

export type ModuleFlagMap = Record<ModuleId, boolean>

const WAVE_MODULES: Record<RolloutWave, ModuleId[]> = {
  0: [],
  1: ['foundational'],
  2: ['foundational', 'consolidation'],
  3: ['foundational', 'consolidation', 'automacao', 'ritmo', 'precisao'],
}

function parseWave(value: unknown): RolloutWave {
  if (value === 0 || value === '0') return 0
  if (value === 1 || value === '1') return 1
  if (value === 2 || value === '2') return 2
  return 3
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value !== 'string') return fallback

  const normalized = value.trim().toLowerCase()
  if (normalized === 'true' || normalized === '1' || normalized === 'on') return true
  if (normalized === 'false' || normalized === '0' || normalized === 'off') return false
  return fallback
}

export function resolveModuleFlags(env: EnvLike): ModuleFlagMap {
  const wave = parseWave(env.VITE_MODULE_ROLLOUT_WAVE)
  const defaults = new Set<ModuleId>(WAVE_MODULES[wave])

  const withOverride = (moduleId: ModuleId, key: string): boolean =>
    parseBoolean(env[key], defaults.has(moduleId))

  return {
    foundational: withOverride('foundational', 'VITE_FF_MODULE_FOUNDATIONAL'),
    consolidation: withOverride('consolidation', 'VITE_FF_MODULE_CONSOLIDATION'),
    automacao: withOverride('automacao', 'VITE_FF_MODULE_AUTOMACAO'),
    ritmo: withOverride('ritmo', 'VITE_FF_MODULE_RITMO'),
    precisao: withOverride('precisao', 'VITE_FF_MODULE_PRECISAO'),
  }
}

const RESOLVED_FLAGS = resolveModuleFlags(import.meta.env as EnvLike)

export function isModuleEnabled(moduleId: ModuleId): boolean {
  return RESOLVED_FLAGS[moduleId]
}

export function getEnabledModuleIds(): ModuleId[] {
  return (Object.entries(RESOLVED_FLAGS) as Array<[ModuleId, boolean]>)
    .filter(([, enabled]) => enabled)
    .map(([moduleId]) => moduleId)
}

export function getModuleFlagsSnapshot(): ModuleFlagMap {
  return { ...RESOLVED_FLAGS }
}
