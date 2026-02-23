import { describe, expect, it } from 'vitest'
import { resolveModuleFlags } from './moduleFlags'

describe('resolveModuleFlags', () => {
  it('usa rollout por ondas quando nao ha override', () => {
    const wave1 = resolveModuleFlags({ VITE_MODULE_ROLLOUT_WAVE: '1' })
    expect(wave1.foundational).toBe(true)
    expect(wave1.consolidation).toBe(false)
    expect(wave1.automacao).toBe(false)

    const wave2 = resolveModuleFlags({ VITE_MODULE_ROLLOUT_WAVE: '2' })
    expect(wave2.foundational).toBe(true)
    expect(wave2.consolidation).toBe(true)
    expect(wave2.ritmo).toBe(false)
  })

  it('permite override por modulo', () => {
    const flags = resolveModuleFlags({
      VITE_MODULE_ROLLOUT_WAVE: '1',
      VITE_FF_MODULE_FOUNDATIONAL: 'false',
      VITE_FF_MODULE_AUTOMACAO: 'true',
    })

    expect(flags.foundational).toBe(false)
    expect(flags.automacao).toBe(true)
  })
})
