import json
from datetime import UTC, date, datetime, timedelta

from groq import AsyncGroq

from app.config import get_settings
from app.schemas.ai import StudyPlanDay, StudyPlanRequest, StudyPlanResponse

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
