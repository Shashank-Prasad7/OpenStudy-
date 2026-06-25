import json
from datetime import UTC, date, datetime, timedelta

from groq import AsyncGroq

from app.config import get_settings
from app.schemas.ai import (
    AIStudyPlannerRequest,
    AIStudyPlannerResponse,
    StudyPlanDay,
    StudyPlanRequest,
    StudyPlanResponse,
)

settings = get_settings()


def _fallback_plan(payload: StudyPlanRequest) -> StudyPlanResponse:
    today = datetime.now(UTC).date()
    days_available = max((payload.exam_date - today).days + 1, 1)
    topics = payload.topics
    plan: list[StudyPlanDay] = []
    for day in range(1, days_available + 1):
        topic = topics[(day - 1) % len(topics)]
        plan.append(
            StudyPlanDay(
                day=day,
                date=today + timedelta(days=day - 1),
                focus=topic,
                tasks=[
                    f"Review core concepts for {topic}",
                    f"Solve practice questions for {topic}",
                    "Log one session note after the final Pomodoro",
                ],
                pomodoros=max(1, round(payload.hours_per_day * 2)),
                checkpoint=f"Explain {topic} from memory in 5 minutes",
            )
        )
    return StudyPlanResponse(
        exam_name=payload.exam_name,
        overview=f"{days_available}-day plan balancing coverage, practice, and revision.",
        plan=plan,
        revision_strategy=[
            "Use active recall at the end of every session.",
            "Revisit weak topics every third day.",
            "Reserve the final day for mixed practice and error review.",
        ],
        risk_flags=[] if days_available >= len(topics) else ["Tight timeline: combine smaller topics into shared sessions."],
    )


def _extract_json(text: str) -> dict:
    cleaned = text.strip()
    if "```" in cleaned:
        parts = cleaned.split("```")
        cleaned = next((part for part in parts if "{" in part and "}" in part), cleaned)
        cleaned = cleaned.removeprefix("json").strip()
    start = cleaned.find("{")
    end = cleaned.rfind("}") + 1
    if start == -1 or end <= start:
        raise ValueError("No JSON object found in Groq response.")
    return json.loads(cleaned[start:end])


async def generate_study_plan(payload: StudyPlanRequest) -> StudyPlanResponse:
    """Generate a structured study plan with Groq, falling back locally when no key is configured."""

    api_key = settings.groq_api_key.get_secret_value() if settings.groq_api_key else ""
    if not api_key:
        return _fallback_plan(payload)

    prompt = f"""
You are OpenStudy's expert study-planning coach for college students.
Return ONLY valid JSON matching this schema:
{{
  "exam_name": string,
  "overview": string,
  "plan": [
    {{
      "day": integer,
      "date": "YYYY-MM-DD",
      "focus": string,
      "tasks": [string],
      "pomodoros": integer,
      "checkpoint": string
    }}
  ],
  "revision_strategy": [string],
  "risk_flags": [string]
}}

Student context:
- Exam: {payload.exam_name}
- Exam date: {payload.exam_date.isoformat()}
- Topics: {", ".join(payload.topics)}
- Hours per day: {payload.hours_per_day}
- Current level: {payload.current_level}
- Constraints: {payload.constraints or "None"}

Plan requirements:
- Prefer Pomodoro-sized tasks.
- Make the first day actionable immediately.
- Include spaced revision and practice, not only reading.
- Keep tasks concise and measurable.
- If the timeline is risky, say so in risk_flags without demotivating the student.
"""

    client = AsyncGroq(api_key=api_key)
    completion = await client.chat.completions.create(
        model=settings.groq_model,
        temperature=0.35,
        max_tokens=2200,
        messages=[
            {"role": "system", "content": "You produce strict JSON study plans for an open-source study app."},
            {"role": "user", "content": prompt},
        ],
    )
    raw_text = completion.choices[0].message.content or ""
    try:
        return StudyPlanResponse.model_validate(_extract_json(raw_text))
    except Exception:
        fallback = _fallback_plan(payload)
        fallback.raw_text = raw_text
        return fallback


# ---------------------------------------------------------------------------
# Enhanced AI Study Planner (new feature)
# ---------------------------------------------------------------------------

_AI_PLANNER_PROMPT = """You are an elite academic mentor, learning strategist, and exam coach.

Generate a highly practical, realistic, and personalized study roadmap.

Student Details:

Subject: {subject}
Exam Goal: {exam}
Current Level: {level}
Study Hours Per Day: {hoursPerDay}
Exam Date: {examDate}
Additional Notes: {notes}

Requirements:

1. Assess the student's situation.
2. Break preparation into learning phases.
3. Create a realistic weekly roadmap.
4. Prioritize high-impact topics.
5. Include measurable milestones.
6. Recommend practice exercises.
7. Include revision cycles.
8. Include mock test strategy.
9. Estimate preparation timeline.
10. Highlight common mistakes.
11. Suggest learning resources.
12. Suggest daily routines.

Return ONLY valid JSON.

JSON format:

{{
  "overview": "",
  "estimatedDuration": "",
  "assessment": "",
  "phases": [
    {{
      "title": "",
      "duration": "",
      "topics": []
    }}
  ],
  "weeklyPlan": [],
  "dailyRoutine": [],
  "milestones": [],
  "practiceStrategy": [],
  "revisionStrategy": [],
  "resources": [],
  "examTips": []
}}"""


def _fallback_ai_planner(payload: AIStudyPlannerRequest) -> AIStudyPlannerResponse:
    """Deterministic local fallback when no Groq API key is configured."""
    return AIStudyPlannerResponse(
        overview=f"Study roadmap for {payload.subject} targeting {payload.exam}. "
                 f"Level: {payload.level}. {payload.hoursPerDay}h/day until {payload.examDate}.",
        estimatedDuration=f"From now until {payload.examDate}",
        assessment=f"As a {payload.level} student preparing for {payload.exam}, "
                   f"you should focus on building a solid foundation and gradually increasing complexity.",
        phases=[
            {"title": "Foundation Building", "duration": "Week 1-2", "topics": [f"Core {payload.subject} fundamentals", "Key terminology and concepts"]},
            {"title": "Deep Dive", "duration": "Week 3-4", "topics": [f"Advanced {payload.subject} topics", "Problem-solving techniques"]},
            {"title": "Practice & Revision", "duration": "Final weeks", "topics": ["Mock tests", "Weak areas review", "Time management"]},
        ],
        weeklyPlan=[
            "Monday–Wednesday: New topics and concept learning",
            "Thursday: Practice problems and exercises",
            "Friday: Review and self-assessment",
            "Saturday: Mock test or timed practice",
            "Sunday: Light revision and rest",
        ],
        dailyRoutine=[
            f"Allocate {payload.hoursPerDay} hours of focused study",
            "Start with active recall of previous material (15 min)",
            "Study new content using Pomodoro technique",
            "End with a summary note of what you learned",
        ],
        milestones=[
            "Complete foundation topics",
            "First full mock test",
            "Identify and address weak areas",
            "Achieve target score in practice tests",
        ],
        practiceStrategy=[
            "Solve progressively harder problems",
            "Time yourself during practice sessions",
            "Review mistakes immediately after each session",
            "Keep an error journal for recurring mistakes",
        ],
        revisionStrategy=[
            "Use spaced repetition for key concepts",
            "Review notes every 3rd day",
            "Create and use flashcards for formulas/definitions",
            "Teach concepts to someone else for deeper understanding",
        ],
        resources=[
            f"Standard textbooks for {payload.subject}",
            f"Past {payload.exam} exam papers",
            "Online practice platforms",
            "YouTube educational channels for visual learning",
        ],
        examTips=[
            "Read questions carefully before answering",
            "Manage time strictly during the exam",
            "Start with questions you are most confident about",
            "Review answers if time permits",
            "Stay calm and focused throughout",
        ],
    )


async def generate_ai_study_plan(payload: AIStudyPlannerRequest) -> AIStudyPlannerResponse:
    """Generate a comprehensive study roadmap using Groq, with a local fallback."""

    api_key = settings.groq_api_key.get_secret_value() if settings.groq_api_key else ""
    if not api_key:
        return _fallback_ai_planner(payload)

    prompt = _AI_PLANNER_PROMPT.format(
        subject=payload.subject,
        exam=payload.exam,
        level=payload.level,
        hoursPerDay=payload.hoursPerDay,
        examDate=payload.examDate,
        notes=payload.notes or "None",
    )

    client = AsyncGroq(api_key=api_key)
    try:
        completion = await client.chat.completions.create(
            model=settings.groq_model,
            temperature=0.4,
            max_tokens=4000,
            messages=[
                {"role": "system", "content": "You are an expert academic mentor. Return ONLY valid JSON study roadmaps."},
                {"role": "user", "content": prompt},
            ],
        )
        raw_text = completion.choices[0].message.content or ""
        data = _extract_json(raw_text)
        return AIStudyPlannerResponse.model_validate(data)
    except Exception:
        return _fallback_ai_planner(payload)
