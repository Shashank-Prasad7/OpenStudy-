# AI Study Planner Feature

The AI Study Planner is a comprehensive feature that allows students to generate, save, view, regenerate, and export highly personalized, realistic study roadmaps using the Groq API.

## Architecture

The feature is implemented across both the FastAPI backend and the React frontend, adhering to the project's existing structure:

```text
React Frontend (Vite)                FastAPI Backend
┌────────────────────────┐           ┌──────────────────────────┐
│  StudyPlannerPage      │           │  Routers (routers/ai.py)  │
│  (Form & Results)      │ ◄───────► │  - /ai/study-planner/... │
└───────────┬────────────┘           └────────────┬─────────────┘
            │                                     │
            ▼                                     ▼
┌────────────────────────┐           ┌──────────────────────────┐
│  React Query Hooks     │           │  Services                │
│  (useStudyPlanner.ts)  │           │  (groq_service.py)       │
└────────────────────────┘           └────────────┬─────────────┘
                                                  │
                                                  ▼
                                     ┌──────────────────────────┐
                                     │  Database / ORM          │
                                     │  (SavedStudyPlan Model)  │
                                     └──────────────────────────┘
```

### Backend Components

1. **SQLAlchemy Model (`backend/app/models/study_plan.py`)**:
   Defines the `SavedStudyPlan` model to persist generated roadmaps in the PostgreSQL database. It maps each plan to a specific user (`user_id`) with fields for `subject`, `exam`, `level`, `hours_per_day`, `exam_date`, `notes`, and the full roadmap JSON data (`plan_data`).
2. **Pydantic Schemas (`backend/app/schemas/ai.py`)**:
   Defines the request and response validation structures:
   - `AIStudyPlannerRequest`: Validates the payload from the frontend.
   - `AIStudyPlannerResponse`: Validates the structured roadmap returned by the Groq API.
   - `SavedPlanCreate` & `SavedPlanRead`: Handles database serialization/deserialization.
3. **Groq Service (`backend/app/services/groq_service.py`)**:
   Contains the business logic to construct the prompt, invoke the Groq SDK with the `llama-3.3-70b-versatile` model, and parse the response. It also implements a robust, deterministic local fallback that returns a high-quality study plan when no API key is configured.
4. **API Router (`backend/app/routers/ai.py`)**:
   Exposes the following endpoints under the `/api/ai` prefix:
   - `POST /study-planner/generate`: Generates a study plan roadmap.
   - `POST /study-planner/save`: Persists a plan to the database.
   - `GET /study-planner/saved`: Retrieves all saved plans for the authenticated user.
   - `GET /study-planner/saved/{plan_id}`: Retrieves a single saved plan.
   - `DELETE /study-planner/saved/{plan_id}`: Deletes a saved plan.

### Frontend Components

1. **React Components (`frontend/src/components/study-planner/`)**:
   - `StudyForm.tsx`: Form UI collecting the inputs (Subject, Exam, Current Level, Hours/Day, Target Date, and Notes) with validation, disabled state, and a beautiful spinner during generation.
   - `StudyPlanResult.tsx`: Renders the generated roadmap in a structured, modern dashboard with 10 dedicated sections, including learning phases, weekly roadmaps, practice strategies, and milestones.
   - `SavedPlans.tsx`: List of saved plans with accordion expansion, details view, and deletion support.
2. **React Page (`frontend/src/pages/StudyPlannerPage.tsx`)**:
   Coordinates the views, state, form submissions, and exports.
3. **React Query Hooks (`frontend/src/hooks/useStudyPlanner.ts`)**:
   Encapsulates state mutations and queries for smooth optimistic UI updates and cache invalidation.

---

## Environment Setup

To use the Groq-powered planner, you must configure your API key.

Add the following environment variable in the backend environment file:

**Location:** `backend/.env` (or copy from `backend/.env.example`)

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

If the key is left empty, the application will gracefully fall back to the deterministic local planner, guaranteeing that the feature remains fully functional.

---

## API Flow & Payload Structure

### 1. Generation Request

**Endpoint:** `POST /api/ai/study-planner/generate`

**Request Body:**
```json
{
  "subject": "Data Structures and Algorithms",
  "exam": "Google SWE Interview",
  "level": "intermediate",
  "hoursPerDay": 3,
  "examDate": "2026-08-30",
  "notes": "Weak in recursion and dynamic programming."
}
```

**Response Body:**
```json
{
  "overview": "Comprehensive preparation roadmap for Data Structures and Algorithms targeting Google SWE Interview.",
  "estimatedDuration": "9 weeks",
  "assessment": "As an intermediate student, you have a solid grasp of basic programming but need to focus on complex algorithm design, optimization, and time complexity analysis.",
  "phases": [
    {
      "title": "Core Foundations & Linear Data Structures",
      "duration": "Weeks 1-3",
      "topics": ["Arrays, Linked Lists, Stacks, Queues", "Big O notation and complexity analysis"]
    }
  ],
  "weeklyPlan": [
    "Week 1: Focus on Array manipulation and two-pointer techniques.",
    "Week 2: Implement and optimize singly and doubly linked lists."
  ],
  "dailyRoutine": [
    "0.5 hours: Active recall and review of previous day's mistakes.",
    "2.0 hours: Deep-dive study and coding implementation.",
    "0.5 hours: Session notes logging and daily reflection."
  ],
  "milestones": [
    "Solve 50 medium-level problems on arrays and linked lists.",
    "Pass the first mock assessment with >70% correctness."
  ],
  "practiceStrategy": [
    "Use the Pomodoro technique for focused 25-minute coding blocks.",
    "Maintain an error log detailing the sub-optimal approaches and their fixes."
  ],
  "revisionStrategy": [
    "Weekly Sunday reviews of all problems solved during the week.",
    "Spaced repetition using flashcards for algorithm complexities."
  ],
  "resources": [
    "Introduction to Algorithms (CLRS)",
    "LeetCode & HackerRank for practice problems",
    "OpenStudy rooms for pair programming and accountability"
  ],
  "examTips": [
    "Always state the time and space complexity before writing code.",
    "Dry run your code with edge cases (empty inputs, single elements) out loud."
  ]
}
```

---

## Export Features

1. **Markdown Export (`.md`)**:
   Generates a formatted Markdown document of the roadmap containing all sections with clear headings and bullet points. It compiles the structured JSON data into a clean, readable text file and triggers a direct browser download.
2. **PDF Export**:
   Creates a beautifully styled, print-friendly HTML representation of the roadmap using tailored typography and clean spacing, then triggers the native browser print/save-to-PDF dialog for a high-quality PDF printout.

---

## Troubleshooting & Verification

To verify the implementation and make sure everything is working correctly, you can run the validation suite:

1. **Verify Backend and AI Tests**:
   Ensure python tests compile and run properly:
   ```bash
   cd backend
   python -m pytest -q
   ```
2. **Verify Frontend Build & Typecheck**:
   Ensure TypeScript definitions align perfectly:
   ```bash
   cd frontend
   npm run typecheck
   npm run build
   ```
