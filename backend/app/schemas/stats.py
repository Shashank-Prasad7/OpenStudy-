from datetime import date

from pydantic import BaseModel


class WeeklyFocusDay(BaseModel):
    date: date
    minutes: int


class UserStats(BaseModel):
    streak_count: int
    focus_minutes: int
    completed_goals: int
    active_rooms: int
    weekly_focus: list[WeeklyFocusDay]
