// src/types/index.ts
export interface User {
  id: string
  name: string
  email: string
  bio?: string
  timezone: string
  avatar_url?: string
  streak_count: number
  created_at: string
}

export interface StudyRoom {
  id: string
  name: string
  description?: string
  subject_tags: string[]
  created_by: string
  visibility: 'public' | 'private'
  max_members: number
  member_count: number
  created_at: string
}

export interface RoomMember {
  id: string
  name: string
  avatar_url?: string
  is_online: boolean
}

export interface RoomDetail extends StudyRoom {
  members: RoomMember[]
}

export interface Goal {
  id: string
  user_id: string
  title: string
  completed: boolean
  deadline?: string
  created_at: string
}

export interface PomodoroState {
  status: 'idle' | 'active' | 'paused' | 'done'
  remaining_secs: number
  session_id?: string
}

export interface PartnerMatch {
  id: string
  user_id: string
  partner_id: string
  match_score: number
  shared_subjects: string[]
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
}

export interface MatchSuggestion {
  match: PartnerMatch
  partner: {
    id: string
    name: string
    email: string
    bio?: string
    avatar_url?: string
    streak_count: number
  }
  reasons: string[]
}

export interface StudyPlan {
  daily_schedule: { day: number; tasks: string[]; pomodoros: number }[]
  total_days: number
  exam_date: string
}

export interface SessionNote {
  id: string
  session_id: string
  note_text: string
  created_at: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedRooms {
  items: StudyRoom[]
  total: number
  limit: number
  offset: number
}

export type WSEvent =
  | { type: 'room_state'; data: { members: RoomMember[]; pomodoro: PomodoroState } }
  | { type: 'pomodoro_tick'; data: { remaining_secs: number } }
  | { type: 'pomodoro_done'; data: { session_id: string } }
  | { type: 'member_joined'; data: RoomMember }
  | { type: 'member_left'; data: { id: string } }
  | { type: 'user_typing'; data: { user_id: string; text: string } }
