export interface User {
  id: string
  name: string
  email: string
  bio?: string | null
  timezone: string
  avatar_url?: string | null
  streak_count: number
  last_study_date?: string | null
  created_at: string
}

export interface StudyRoom {
  id: string
  name: string
  description?: string | null
  subject_tags: string[]
  created_by: string
  visibility: 'public' | 'private'
  max_members: number
  member_count: number
  created_at: string
}

export interface RoomMembership {
  id: string
  joined_at: string
  user: Pick<User, 'id' | 'name' | 'avatar_url' | 'timezone'>
}

export interface PresenceMember {
  id: string
  name: string
  avatar_url?: string | null
}

export interface RoomDetail extends StudyRoom {
  members: RoomMembership[]
}

export interface Goal {
  id: string
  user_id: string
  title: string
  completed: boolean
  deadline?: string | null
  completed_at?: string | null
  created_at: string
}

export interface PomodoroState {
  status: 'idle' | 'active' | 'paused' | 'completed'
  remaining_secs: number
  duration_secs: number
  session_id?: string | null
}

export interface PartnerMatch {
  id: string
  user_a_id: string
  user_b_id: string
  match_score: number
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
}

export interface MatchSuggestion {
  match: PartnerMatch
  partner: Pick<User, 'id' | 'name' | 'avatar_url' | 'timezone'>
  reasons: string[]
}

export interface Preference {
  id: string
  user_id: string
  subjects: string[]
  study_time: 'morning' | 'evening' | 'night'
  style: 'solo' | 'group' | 'mix'
}

export interface StudyPlanRequest {
  exam_name: string
  exam_date: string
  topics: string[]
  hours_per_day: number
  current_level: string
  constraints?: string
}

export interface StudyPlanDay {
  day: number
  date: string
  focus: string
  tasks: string[]
  pomodoros: number
  checkpoint: string
}

export interface StudyPlan {
  exam_name: string
  overview: string
  plan: StudyPlanDay[]
  revision_strategy: string[]
  risk_flags: string[]
  raw_text?: string | null
}

export interface SessionNote {
  id: string
  user_id: string
  session_id: string
  note_text: string
  created_at: string
}

export interface PaginatedRooms {
  items: StudyRoom[]
  total: number
  limit: number
  offset: number
}

export interface WeeklyFocusDay {
  date: string
  minutes: number
}

export interface UserStats {
  streak_count: number
  focus_minutes: number
  completed_goals: number
  active_rooms: number
  weekly_focus: WeeklyFocusDay[]
}

export type WSEvent =
  | { event: 'room_state'; members: PresenceMember[]; pomodoro: PomodoroState }
  | { event: 'pomodoro_tick'; remaining_secs: number; duration_secs: number; status: PomodoroState['status']; session_id?: string | null }
  | { event: 'pomodoro_done'; session_id: string }
  | { event: 'member_joined'; user: PresenceMember }
  | { event: 'member_left'; user_id: string }
  | { event: 'user_typing'; user_id: string; text: string }
