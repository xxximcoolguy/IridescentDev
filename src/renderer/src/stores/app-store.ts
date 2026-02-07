import { create } from 'zustand'
import type { ViewMode, ClaudeStatus } from '../../../shared/types'

interface AppState {
  /** 当��工作目录 */
  workingDirectory: string | null
  /** Claude 进程状态 */
  claudeStatus: ClaudeStatus
  /** 当前视图模式 */
  viewMode: ViewMode

  setWorkingDirectory: (dir: string | null) => void
  setClaudeStatus: (status: ClaudeStatus) => void
  setViewMode: (mode: ViewMode) => void
}

export const useAppStore = create<AppState>((set) => ({
  workingDirectory: null,
  claudeStatus: 'idle',
  viewMode: 'terminal',

  setWorkingDirectory: (dir): void => set({ workingDirectory: dir }),
  setClaudeStatus: (status): void => set({ claudeStatus: status }),
  setViewMode: (mode): void => set({ viewMode: mode })
}))
