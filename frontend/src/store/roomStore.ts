import { create } from 'zustand'
import type { PomodoroState, RoomMember } from '@/types'

interface RoomStore {
  members: RoomMember[]
  pomodoro: PomodoroState
  setMembers: (members: RoomMember[]) => void
  addMember: (member: RoomMember) => void
  removeMember: (id: string) => void
  setPomodoro: (state: PomodoroState) => void
  tickPomodoro: (remaining_secs: number) => void
  reset: () => void
}

const defaultPomodoro: PomodoroState = { status: 'idle', remaining_secs: 25 * 60 }

export const useRoomStore = create<RoomStore>(set => ({
  members: [],
  pomodoro: defaultPomodoro,
  setMembers: (members) => set({ members }),
  addMember: (member) => set(s => ({ members: [...s.members.filter(m => m.id !== member.id), member] })),
  removeMember: (id) => set(s => ({ members: s.members.filter(m => m.id !== id) })),
  setPomodoro: (pomodoro) => set({ pomodoro }),
  tickPomodoro: (remaining_secs) => set(s => ({ pomodoro: { ...s.pomodoro, remaining_secs } })),
  reset: () => set({ members: [], pomodoro: defaultPomodoro }),
}))
