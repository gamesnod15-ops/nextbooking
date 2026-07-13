import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { Module, ModuleId, PlanId } from '@/types'
import { defaultModules } from '@/config/modules'
import { planAllows } from '@/config/plans'

export interface ModulesState {
  modules: Module[]
}

const stored = localStorage.getItem('modules')
const storedMap: Record<string, Module> = stored
  ? (JSON.parse(stored) as Module[]).reduce((acc, m) => { acc[m.id] = m; return acc }, {} as Record<string, Module>)
  : {}
// Merge: for known modules, respect stored toggle state
// UNLESS the default just changed to enabled (new feature release) — detected by comparing stored default state
const storedDefaults = localStorage.getItem('modules_defaults')
const storedDefaultMap: Record<string, boolean> = storedDefaults ? JSON.parse(storedDefaults) : {}
const initialModules: Module[] = defaultModules.map(def => {
  if (!storedMap[def.id]) return def
  // If the default changed from false → true since last save, use new default
  if (def.isEnabled && storedDefaultMap[def.id] === false) return def
  return { ...def, isEnabled: storedMap[def.id].isEnabled }
})
// Persist current defaults fingerprint
localStorage.setItem('modules_defaults', JSON.stringify(
  Object.fromEntries(defaultModules.map(m => [m.id, m.isEnabled]))
))

const initialState: ModulesState = {
  modules: initialModules,
}

const modulesSlice = createSlice({
  name: 'modules',
  initialState,
  reducers: {
    toggleModule(state, action: PayloadAction<ModuleId>) {
      const mod = state.modules.find((m) => m.id === action.payload)
      if (mod && !mod.isBuiltIn) {
        mod.isEnabled = !mod.isEnabled
        localStorage.setItem('modules', JSON.stringify(state.modules))
      }
    },
    setModuleEnabled(state, action: PayloadAction<{ id: ModuleId; enabled: boolean }>) {
      const mod = state.modules.find((m) => m.id === action.payload.id)
      if (mod && !mod.isBuiltIn) {
        mod.isEnabled = action.payload.enabled
        localStorage.setItem('modules', JSON.stringify(state.modules))
      }
    },
    applyPlanAccess(state, action: PayloadAction<PlanId>) {
      state.modules = state.modules.map((module) => {
        if (module.isBuiltIn) {
          return { ...module, isEnabled: true }
        }

        return {
          ...module,
          isEnabled: planAllows(action.payload, module.requiredPlan),
        }
      })

      localStorage.setItem('modules', JSON.stringify(state.modules))
    },
  },
})

export const { toggleModule, setModuleEnabled, applyPlanAccess } = modulesSlice.actions
export default modulesSlice.reducer
