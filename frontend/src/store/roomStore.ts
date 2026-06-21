import { create } from 'zustand'
import type { PomodoroState, PresenceMember } from '@/types'

interface RoomStore {
  members: PresenceMember[]
  pomodoro: PomodoroState
  setMembers: (members: PresenceMember[]) => void
  addMember: (member: PresenceMember) => void
  removeMember: (id: string) => void
  setPomodoro: (state: PomodoroState) => void
  reset: () => void
}

const defaultPomodoro: PomodoroState = {
  status: 'idle',
  remaining_secs: 25 * 60,
  duration_secs: 25 * 60,
  session_id: null,
}

export const useRoomStore = create<RoomStore>(set => ({
  members: [],
  pomodoro: defaultPomodoro,
  setMembers: members => set({ members }),
  addMember: member => set(state => ({ members: [...state.members.filter(item => item.id !== member.id), member] })),
  removeMember: id => set(state => ({ members: state.members.filter(item => item.id !== id) })),
  setPomodoro: pomodoro => set({ pomodoro }),
  reset: () => set({ members: [], pomodoro: defaultPomodoro }),
}))
