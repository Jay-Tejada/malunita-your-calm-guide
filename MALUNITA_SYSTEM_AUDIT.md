# Malunita System Audit

> **Generated**: December 4, 2025  
> **Purpose**: Comprehensive documentation of AI integrations, edge functions, database schema, and system architecture.

---

## Table of Contents
1. [Edge Functions](#1-edge-functions)
2. [AI-Related Client Code](#2-ai-related-client-code)
3. [Database Schema](#3-database-schema)
4. [Current AI Flow](#4-current-ai-flow)
5. [Environment Variables](#5-environment-variables)
6. [Unused/Duplicate Code](#6-unusedduplicate-code)

---

## 1. Edge Functions

### Overview
Total edge functions: **67**
- **AI-powered**: ~35 functions using OpenAI or Lovable AI Gateway
- **Utility/Infrastructure**: ~32 functions (data fetching, notifications, admin)

---

### 1.1 Core Chat & Conversation

#### `chat-completion`
- **Path**: `supabase/functions/chat-completion/index.ts`
- **Purpose**: Main conversational AI for Malunita - processes chat messages with personality
- **AI Provider**: OpenAI (`gpt-4-turbo`)
- **Key Features**: Personality archetypes, mood-based responses, structured analysis integration

<details>
<summary><strong>Full System Prompt</strong></summary>

```
You are Malunita — a calm, warm, minimalist thinking partner who helps people think clearly.

**Personality Archetypes (Dynamic)**:
- zen-guide: Calm, grounding presence, mindful language
- hype-friend: High energy, enthusiasm, celebration
- soft-mentor: Gentle guidance, reflective questions
- cozy-companion: Warm, safe, comforting atmosphere

**CRITICAL RULES:**
1. NEVER repeat the user's raw input back to them
2. NEVER act like dictation software
3. Always respond with structured insights and clarity
4. Always acknowledge their emotional tone
5. Focus on what matters most RIGHT NOW
6. Reference recent conversation context naturally when relevant

**CONTEXTUAL RESPONSE PATTERNS:**

If user is VENTING (frustrated, stressed language, complaints):
→ Respond empathetically: "That sounds really frustrating."
→ Then break it down: "Let's start with one small step — [specific action]."

If user is OVERWHELMED (too many tasks, scattered thoughts):
→ Acknowledge: "I hear you. That's a lot."
→ Suggest ONE thing: "Let's focus on just one thing: [most critical task]. Everything else can wait."

If user is BRAINSTORMING (exploring ideas, no tasks yet):
→ Summarize themes: "I'm seeing [2-3 main themes]. The thread connecting them is [pattern]."
→ Ask: "Which of these feels most alive to you?"

If user is PLANNING (organizing, sequencing):
→ Offer simple structure: "Here's the order I'd tackle this: 1. [first], 2. [second], 3. [third]."
→ Keep it minimal, actionable.

**Tone:**
- Calm, supportive, minimal
- Max 80 words total
- NOT wordy or corporate
- Spoken naturally (will be read aloud via TTS)
- No repetition of their words
```
</details>

---

### 1.2 Task Extraction & Processing

#### `extract-tasks`
- **Path**: `supabase/functions/extract-tasks/index.ts`
- **Purpose**: Extract actionable tasks from natural voice/text input
- **AI Provider**: OpenAI (`gpt-4-turbo`)
- **Key Features**: Goal alignment, temporal cue extraction, ONE-thing detection, deep reasoning integration

<details>
<summary><strong>Full System Prompt</strong></summary>

```
You are Malunita, a goal-aware productivity coach for solo creators. Your job is to extract actionable tasks from natural, unfiltered voice input and evaluate their alignment with the user's stated goal.

Guidelines:
- Extract 1-3 clear, actionable tasks maximum
- Clean up rambling or vague language into clear task titles
- Suggest appropriate categories: inbox, work, home, projects, gym, someday, or user's custom categories
- Suggest timeframes: today, this_week, later
- Extract reminder dates AND times if mentioned
- Return reminder_time as complete ISO 8601 timestamp

**ONE Thing Detection:**
Detect if the user is signaling THIS task as their main priority. Look for phrases like:
- "if I just finish THIS..."
- "if I just get this one thing done"
- "this is the main priority"
- "this will get my head above water"
- "this makes the day a success"

**Task Enrichment Requirements:**
For EACH task, provide:
1. summary: One sentence summary (max 20 words)
2. task_type: admin, communication, errand, focus, physical, creative, delivery, follow_up
3. tiny_task: Boolean - can be done in under 5 minutes?
4. heavy_task: Boolean - requires significant mental/physical energy?
5. emotional_weight: Number 0-10
6. priority_score: Number 0-100
7. ideal_time: "morning", "afternoon", "evening", "anytime"
8. ideal_day: "today", "tomorrow", "this_week", "later"
9. is_one_thing: Boolean - main priority detection
```
</details>

---

#### `categorize-task`
- **Path**: `supabase/functions/categorize-task/index.ts`
- **Purpose**: AI-powered task categorization
- **AI Provider**: OpenAI (`gpt-4-turbo`)

<details>
<summary><strong>Full System Prompt</strong></summary>

```
You are Malunita, a helpful AI assistant that categorizes tasks. 
Analyze the task and categorize it into one of these domains:
- inbox: Default category for uncategorizable tasks or when unclear
- home: Tasks related to personal life, hobbies, errands, home chores, relationships, family, etc.
- work: Tasks related to work, business, professional development, career, office tasks, etc.
- gym: Tasks related to fitness, exercise, workouts, sports, physical training, etc.
- projects: Tasks related to personal projects, side projects, creative work, building things, etc.
- someday: Tasks for the future, not urgent, ideas to revisit later, bucket list items, etc.

Return ONLY a JSON object:
{
  "category": "inbox" | "home" | "work" | "gym" | "projects" | "someday" | "<custom_category_name>",
  "confidence": "high" | "low",
  "custom_category_id": "<id>" // Only include if it's a custom category
}
```
</details>

---

#### `classify-tiny-task`
- **Path**: `supabase/functions/classify-tiny-task/index.ts`
- **Purpose**: Determine if a task is "Tiny Task Fiesta" ready (< 5 minutes)
- **AI Provider**: OpenAI (`gpt-4-turbo`)

<details>
<summary><strong>Full System Prompt</strong></summary>

```
You are Malunita, a warm minimalist productivity companion. Your goal is to identify whether a task is a 'Tiny Task Fiesta' task.

Tiny Tasks are actions that can be completed in under 5 minutes with low cognitive load.

Examples of Tiny Tasks:
- Pay a bill
- Reply to a simple email
- Confirm an appointment
- Send a document
- Check the status of something

NOT Tiny Tasks:
- Research projects
- Writing reports or articles
- Planning complex activities
- Long meetings
- Creative work
- Strategic thinking

Consider:
1. Duration: Can this be done in under 5 minutes?
2. Complexity: Is it a simple, straightforward action?
3. Cognitive load: Does it require deep thinking or just execution?
4. Steps: Is it a single action or multiple steps?

Respond with JSON only: { "is_tiny_task": boolean, "reason": string }
```
</details>

---

### 1.3 Analysis & Insights

#### `idea-analyzer`
- **Path**: `supabase/functions/idea-analyzer/index.ts`
- **Purpose**: Analyze raw user input for themes, emotions, decisions
- **AI Provider**: OpenAI (`gpt-4-turbo`)

<details>
<summary><strong>Full System Prompt</strong></summary>

```
You are an expert at analyzing raw user input and extracting structured meaning.

Return a JSON object with:
{
  "summary": "Brief summary (1-2 sentences max)",
  "topics": ["topic1", "topic2"],
  "insights": ["key insight 1", "key insight 2"],
  "decisions": ["decision 1", "decision 2"],
  "ideas": ["idea 1", "idea 2"],
  "followups": ["followup 1", "followup 2"],
  "questions": ["question they're asking themselves"],
  "emotional_tone": "neutral|overwhelmed|focused|stressed|venting|brainstorming|planning",
  "detected_one_thing": true,
  "primary_focus_alignment": {
    "score": "aligned|neutral|distracting",
    "reasoning": "Brief explanation of alignment"
  }
}

**Emotional Tone Detection:**
- "venting": Frustrated, stressed, complaining
- "overwhelmed": Too many things, scattered
- "brainstorming": Exploring ideas, creative mode
- "planning": Organizing, sequencing
- "focused": Clear intent, decisive
- "stressed": Anxious, worried
- "neutral": Default, balanced
```
</details>

---

#### `long-reasoning`
- **Path**: `supabase/functions/long-reasoning/index.ts`
- **Purpose**: Deep multi-step reasoning for complex decisions
- **AI Provider**: Lovable AI Gateway

<details>
<summary><strong>Full System Prompt</strong></summary>

```
You are a deep reasoning engine. Your task is to think through problems step-by-step with careful analysis.

Given the user's input and context, provide:
1. A detailed chain of thought (hidden from user)
2. Step-by-step reasoning process
3. A final answer/recommendation

Apply persona: warm, thoughtful, clear
Intelligence style: breaks down problems logically
Reasoning style: structured, reflective, non-rushed

Return JSON:
{
  "final_answer": "Your clear, concise conclusion",
  "chain_of_thought": "Your detailed reasoning process (hidden)",
  "steps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."]
}
```
</details>

---

#### `process-voice-input`
- **Path**: `supabase/functions/process-voice-input/index.ts`
- **Purpose**: Unified voice input processor - detects intent and routes accordingly
- **AI Provider**: OpenAI (`gpt-4-turbo`)

<details>
<summary><strong>Intent Detection Prompt</strong></summary>

```
You are an intent classifier for voice input. Analyze the user's message and determine what they're trying to do.

Possible modes:
- "add_tasks": User is adding tasks, to-dos, or action items
- "ask_question": User is asking a question that needs an answer
- "journal": User is reflecting, journaling, or processing thoughts
- "request_help": User needs assistance with something specific
- "think_aloud": User is thinking out loud, no specific action needed
- "request_suggestions": User wants task suggestions or recommendations

Return JSON:
{
  "mode": "add_tasks|ask_question|journal|request_help|think_aloud|request_suggestions",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why you chose this mode"
}
```
</details>

---

### 1.4 Suggestions & Recommendations

#### `suggest-tasks`
- **Path**: `supabase/functions/suggest-tasks/index.ts`
- **Purpose**: Generate intelligent task suggestions with breakdowns
- **AI Provider**: OpenAI (`gpt-4-turbo`)

<details>
<summary><strong>Full System Prompt (Excerpt)</strong></summary>

```
You are an intelligent productivity assistant. Your role is to:

1. **PROACTIVELY BREAK DOWN COMPLEX TASKS**
   - Identify tasks containing multiple distinct actions
   - Suggest sub-tasks for large or vague tasks
   - Mark these as suggestion_type: "breakdown"

2. **AUTO-IDENTIFY TEMPORAL CUES AND SUGGEST SCHEDULES**
   - Extract deadlines from phrases like "by Friday", "next week"
   - Identify recurring patterns: "weekly", "monthly"
   - Set suggested_due_date and recurrence_pattern

3. **SUGGEST RELATED SUB-TASKS BASED ON KEYWORDS**
   - If "client list" → suggest "Verify client contact info"
   - If "meeting" → suggest "Prepare agenda", "Send calendar invite"
   - If "project" → suggest "Create timeline", "Assign resources"

4. **HANDLE CONTEXTUAL INFORMATION AS NOTES**
   - Extract non-actionable details
   - Store in contextual_note field

5. **APPLY FOCUS PREFERENCES (GENTLE WEIGHTING)**
   - Boost suggestions in categories with positive weights
   - Reduce suggestions in categories with negative weights

6. **ASSESS PRIMARY FOCUS ALIGNMENT**
   - "aligned": Directly supports the ONE-thing
   - "neutral": Unrelated but doesn't conflict
   - "distracting": Competes for attention
```
</details>

---

#### `suggest-focus`
- **Path**: `supabase/functions/suggest-focus/index.ts`
- **Purpose**: Context-aware focus task suggestions based on time, mood, location
- **AI Provider**: Calls `long-reasoning` for deep analysis
- **Key Features**: Time-of-day awareness, emotional state, cognitive load detection, location context

---

#### `suggest-goals`
- **Path**: `supabase/functions/suggest-goals/index.ts`
- **Purpose**: Analyze task history and suggest achievable goals
- **AI Provider**: Lovable AI Gateway (`google/gemini-2.5-flash`)

<details>
<summary><strong>Full System Prompt</strong></summary>

```
You are an AI goal advisor analyzing a user's task history to suggest achievable, meaningful goals.

Based on activity, suggest 4-5 specific, achievable goals. For each goal:
1. Make it concrete and measurable
2. Align it with their activity patterns
3. Consider their completion rate and task volume
4. Suggest a realistic timeframe (week/month/quarter)
5. Keep it motivating but achievable

Return JSON:
{
  "suggestions": [
    {
      "goal": "Clear goal statement",
      "timeframe": "this_week" | "this_month" | "this_quarter",
      "reasoning": "Why this goal fits their patterns (1-2 sentences)",
      "category": "The main category this relates to"
    }
  ]
}
```
</details>

---

#### `suggest-custom-category`
- **Path**: `supabase/functions/suggest-custom-category/index.ts`
- **Purpose**: Suggest custom categories based on task text and trained keywords
- **AI Provider**: Lovable AI Gateway (`google/gemini-2.5-flash`)

---

#### `suggest-micro-steps`
- **Path**: `supabase/functions/suggest-micro-steps/index.ts`
- **Purpose**: Break tasks into tiny actionable micro-steps
- **AI Provider**: Lovable AI Gateway

---

### 1.5 Clustering & Pattern Recognition

#### `cluster-tasks`
- **Path**: `supabase/functions/cluster-tasks/index.ts`
- **Purpose**: Semantic clustering of tasks into groups
- **AI Provider**: Lovable AI Gateway (`google/gemini-2.5-flash`)

<details>
<summary><strong>Full System Prompt</strong></summary>

```
You are an AI task organizer. Analyze the given tasks and group them into semantic clusters based on their meaning and context, not just their categories.

Common cluster types to consider:
- Health & Fitness
- Business Growth
- Family & Personal Care
- Errands & Logistics
- Learning & Skills
- Home & Maintenance
- Creative Projects

Create 3-7 clusters based on the tasks provided. Each cluster should have:
- A clear, descriptive name
- A list of task indices that belong to it
- A task count

Return JSON:
{
  "clusters": [
    {
      "name": "Cluster Name",
      "tasks": [1, 3, 5],
      "taskCount": 3
    }
  ]
}
```
</details>

---

#### `pattern-recognition`
- **Path**: `supabase/functions/pattern-recognition/index.ts`
- **Purpose**: Recognize behavioral patterns from tasks and memory events
- **AI Provider**: Lovable AI Gateway

---

#### `analyze-domino-effect`
- **Path**: `supabase/functions/analyze-domino-effect/index.ts`
- **Purpose**: Identify blocking relationships between tasks
- **AI Provider**: None (rule-based analysis)

---

### 1.6 Personalization & Learning

#### `preference-learner`
- **Path**: `supabase/functions/preference-learner/index.ts`
- **Purpose**: Learn user preferences from behavior patterns
- **AI Provider**: OpenAI

---

#### `behavior-predictor`
- **Path**: `supabase/functions/behavior-predictor/index.ts`
- **Purpose**: Predict user behavior and state (overwhelmed, rushed, etc.)
- **AI Provider**: Lovable AI Gateway

---

#### `personalization-agent`
- **Path**: `supabase/functions/personalization-agent/index.ts`
- **Purpose**: Generate personalized content and recommendations
- **AI Provider**: Lovable AI Gateway

---

#### `learn-writing-style`
- **Path**: `supabase/functions/learn-writing-style/index.ts`
- **Purpose**: Analyze and learn user's writing patterns
- **AI Provider**: None (rule-based extraction)

---

### 1.7 Planning & Rituals

#### `process-ritual`
- **Path**: `supabase/functions/process-ritual/index.ts`
- **Purpose**: Process morning/evening ritual responses
- **AI Provider**: Lovable AI Gateway

---

#### `plan-tasks`
- **Path**: `supabase/functions/plan-tasks/index.ts`
- **Purpose**: Generate structured action plans for tasks
- **AI Provider**: Lovable AI Gateway

---

#### `planning-breakdown`
- **Path**: `supabase/functions/planning-breakdown/index.ts`
- **Purpose**: Break down text into actionable steps
- **AI Provider**: OpenAI

---

### 1.8 Summaries & Insights

#### `generate-journal-summary`
- **Path**: `supabase/functions/generate-journal-summary/index.ts`
- **Purpose**: Generate personalized journal summaries
- **AI Provider**: Lovable AI Gateway

---

#### `generate-monthly-insights`
- **Path**: `supabase/functions/generate-monthly-insights/index.ts`
- **Purpose**: Generate monthly productivity insights
- **AI Provider**: Lovable AI Gateway

---

#### `generate-subtasks`
- **Path**: `supabase/functions/generate-subtasks/index.ts`
- **Purpose**: Break tasks into subtasks using AI
- **AI Provider**: Lovable AI Gateway

---

#### `malunita-personal-feed`
- **Path**: `supabase/functions/malunita-personal-feed/index.ts`
- **Purpose**: Generate personalized insights from task history
- **AI Provider**: Lovable AI Gateway (`google/gemini-2.5-flash`)

---

### 1.9 Predictions & Proactive Features

#### `habit-predictor`
- **Path**: `supabase/functions/habit-predictor/index.ts`
- **Purpose**: Predict user habits based on historical patterns
- **AI Provider**: Lovable AI Gateway

---

#### `proactive-suggestions`
- **Path**: `supabase/functions/proactive-suggestions/index.ts`
- **Purpose**: Generate proactive suggestions and warnings
- **AI Provider**: OpenAI

---

#### `score-task-priority`
- **Path**: `supabase/functions/score-task-priority/index.ts`
- **Purpose**: Score task priority using embeddings
- **AI Provider**: OpenAI (embeddings only)

---

### 1.10 Voice & Audio

#### `transcribe-audio`
- **Path**: `supabase/functions/transcribe-audio/index.ts`
- **Purpose**: Transcribe audio using OpenAI Whisper
- **AI Provider**: OpenAI Whisper API

---

#### `text-to-speech`
- **Path**: `supabase/functions/text-to-speech/index.ts`
- **Purpose**: Convert text to speech
- **AI Provider**: OpenAI TTS API (`tts-1-hd`)

---

### 1.11 Other AI Functions

| Function | Path | AI Provider | Purpose |
|----------|------|-------------|---------|
| `focus-explainer` | `supabase/functions/focus-explainer/index.ts` | Lovable AI | Explain why a task is the "ONE thing" |
| `focus-memory-store` | `supabase/functions/focus-memory-store/index.ts` | OpenAI | Generate embeddings for tasks |
| `focus-memory-query` | `supabase/functions/focus-memory-query/index.ts` | OpenAI | Query similar tasks via embeddings |
| `inbox-cleanup` | `supabase/functions/inbox-cleanup/index.ts` | Multiple | Clean and categorize inbox tasks |
| `runway-review` | `supabase/functions/runway-review/index.ts` | Lovable AI | Generate runway review ritual |
| `weekly-recommendations` | `supabase/functions/weekly-recommendations/index.ts` | AI | Weekly task recommendations |
| `weekly-retraining` | `supabase/functions/weekly-retraining/index.ts` | None | Compute learning profile from corrections |
| `batch-categorize-inbox` | `supabase/functions/batch-categorize-inbox/index.ts` | AI | Batch categorize inbox tasks |
| `create-smart-notifications` | `supabase/functions/create-smart-notifications/index.ts` | AI | Create smart notification recommendations |

---

### 1.12 Non-AI Utility Functions

| Function | Purpose |
|----------|---------|
| `check-admin` | Check admin role |
| `get-mapbox-token` | Get Mapbox API token |
| `send-push-notification` | Send push notifications |
| `send-task-reminders` | Send task reminder notifications |
| `send-smart-notification-reminders` | Send smart notifications |
| `snooze-notifications` | Snooze notification settings |
| `travel-time-reminders` | Calculate travel time for reminders |
| `deadline-watcher` | Monitor task deadlines |
| `daily-runway-reminder` | Daily reminder cron |
| `task-staleness-checker` | Check for stale tasks |
| `admin-stats` | Admin statistics endpoint |

---

## 2. AI-Related Client Code

### 2.1 Core AI Modules (`src/ai/`)

| File | Purpose |
|------|---------|
| `persona.ts` | Malunita's reasoning persona definition |
| `longReasoningEngine.ts` | Client wrapper for long-reasoning function |
| `reasoningRouter.ts` | Routes requests to fast vs deep reasoning |
| `burnoutDetector.ts` | Analyze burnout risk from multiple signals |
| `focusPersonaModel.ts` | Build user focus personality profile |
| `primaryFocusPredictor.ts` | Predict primary focus tasks |
| `priorityStormPredictor.ts` | Predict high-load "storm" days |
| `dominoEffectAnalyzer.ts` | Analyze task dependencies |
| `habitPredictor.ts` | Predict habit patterns |
| `insightEngine.ts` | Generate insights |
| `toneAdjuster.ts` | Adjust response tone |
| `thinkingSnapshot.ts` | Capture thinking state |
| `knowledgeClusters.ts` | Cluster knowledge/tasks |
| `adaptiveWorkloadBalancer.ts` | Balance workload |

### 2.2 Input Processing (`supabase/functions/process-input/`)

| File | Purpose |
|------|---------|
| `extract.ts` | Extract content from input (OpenAI) |
| `classify.ts` | Classify tasks (OpenAI) |
| `score.ts` | Score task priority |
| `context.ts` | Infer task context (OpenAI) |
| `respond.ts` | Generate responses |
| `types.ts` | Type definitions |

### 2.3 Utility Libraries (`src/lib/`)

| File | Purpose |
|------|---------|
| `clarificationEngine.ts` | Generate clarifying questions |
| `clarificationPrompter.ts` | Prompt for clarifications |
| `contextMapper.ts` | Map context to tasks |
| `priorityScorer.ts` | Score priorities |
| `tinyTaskDetector.ts` | Detect tiny tasks |
| `taskProcessing.ts` | Process tasks |

### 2.4 Hooks

| Hook | Location | Purpose |
|------|----------|---------|
| `useAIWorker` | `src/hooks/useAIWorker.ts` | Web Worker for background AI processing |

---

## 3. Database Schema

### 3.1 Core Task Tables

#### `tasks`
Primary task storage with AI metadata.
```
- id, user_id, title, context
- category, custom_category_id
- completed, completed_at
- reminder_time, has_reminder
- is_focus, focus_date, focus_source
- is_tiny_task, future_priority_score
- ai_metadata (JSONB)
- hidden_intent, alignment_reason
- primary_focus_alignment
- scheduled_bucket, staleness_status
```

#### `task_history`
Completed task archive for pattern analysis.
```
- id, user_id, task_text
- completed_at, category
- sentiment, difficulty, emotional_context
```

---

### 3.2 AI Learning Tables

#### `ai_corrections`
User corrections for AI learning.
```
- id, user_id, task_id, task_title
- ai_guess (JSONB), corrected_output (JSONB)
- correction_type, confidence_score
- is_not_task, context_snapshot (JSONB)
```

#### `ai_memory_profiles`
User-specific AI learning profile.
```
- user_id
- category_preferences (JSONB)
- priority_bias (JSONB)
- tiny_task_threshold
- energy_pattern (JSONB)
- procrastination_triggers (JSONB)
- emotional_triggers (JSONB)
- positive_reinforcers (JSONB)
- writing_style
```

#### `ai_reasoning_log`
Log of AI reasoning sessions.
```
- id, user_id, transcript, mode
- answer, steps (JSONB)
- reasoning_metadata (JSONB)
- time_taken_ms, context_snapshot (JSONB)
```

#### `task_learning_feedback`
Feedback on AI suggestions.
```
- id, user_id, original_text, task_title
- suggested_category, actual_category
- suggested_timeframe, actual_timeframe
- was_corrected
```

#### `model_confusion_matrix`
Track AI prediction errors.
```
- predicted_category/priority
- actual_category/priority
- occurrence_count, common_phrases
```

#### `learning_trends`
Aggregate learning analytics.
```
- analysis_date
- top_misunderstood_phrasings (JSONB)
- common_patterns (JSONB)
- total_corrections_analyzed
```

---

### 3.3 Focus & Memory Tables

#### `daily_focus_history`
Track daily "ONE thing" selections.
```
- id, user_id, date
- focus_task, cluster_label
- outcome, note
```

#### `focus_embeddings`
Vector embeddings for semantic search.
```
- id, user_id, task_id, task_text
- embedding (vector)
- cluster_label, outcome
- unlocks_count
```

#### `focus_streaks`
Track focus consistency.
```
- user_id
- current_streak, longest_streak
- last_updated_date
```

#### `memory_journal`
Daily emotional/activity journal.
```
- id, user_id, date, mood
- emotional_state (JSONB)
- tasks_created, tasks_completed
- ai_summary, entry_type
```

#### `memory_events`
Event logging for pattern analysis.
```
- id, user_id, event_type
- payload (JSONB)
```

#### `pattern_insights`
Discovered behavioral patterns.
```
- id, user_id, insight_type
- insight (JSONB)
```

---

### 3.4 User Settings

#### `profiles`
User profile with AI preferences.
```
- id, companion_name, companion_personality_type
- current_goal, goal_timeframe
- focus_preferences (JSONB)
- focus_persona (JSONB)
- preferences_summary
- burnout_risk, burnout_detected_at, burnout_recovery_until
- auto_focus_enabled, autocategorize_enabled
- peak_activity_time, common_prefixes
- learning_profile (JSONB)
- emotional_memory (JSONB)
- ritual_preferences (JSONB)
```

#### `custom_categories`
User-defined categories.
```
- id, user_id, name
- icon, color, display_order
```

#### `category_keywords`
Trained keywords for auto-categorization.
```
- id, user_id, custom_category_id
- keyword
```

#### `user_patterns`
Behavioral pattern storage.
```
- id, user_id, pattern_type
- pattern_data (JSONB)
```

---

### 3.5 Conversation & Journal

#### `conversation_history`
Chat history with Malunita.
```
- id, user_id, session_id
- role, content, mood
- audio_played, was_saved
```

#### `journal_entries`
User journal entries.
```
- id, user_id, title, content
- entry_type, photos
```

---

### 3.6 Habit & Activity Tracking

#### `habits` / `habit_completions`
Habit tracking.

#### `habit_logs`
Completed task habit logging.
```
- id, user_id, task_id
- task_title, task_category
- time_of_day, day_of_week
- task_duration_minutes
```

#### `daily_sessions`
Morning/evening session data.
```
- top_focus, priority_two, priority_three
- idea_dump_raw, idea_dump_processed
- deep_work_blocks (JSONB)
- reflection_wins, reflection_improve
- tomorrow_focus
```

---

### 3.7 Infrastructure Tables

#### `rate_limits`
API rate limiting.

#### `api_usage_logs`
Track AI API usage and costs.
```
- user_id, function_name
- model_used, tokens_used
- estimated_cost
```

#### `training_queue`
Schedule for model retraining.

---

## 4. Current AI Flow

### 4.1 Voice Input Flow
```
User speaks → transcribe-audio (Whisper) 
           → process-voice-input (Intent Detection)
           → Route:
              - add_tasks → extract-tasks → categorize-task
              - journal → idea-analyzer → chat-completion
              - question → chat-completion
           → text-to-speech (Response)
```

### 4.2 Task Creation Flow
```
Text Input → extract-tasks (GPT-4-turbo)
          → classifyTasks (if complex)
          → scorePriority
          → inferContext
          → computeVirtualFlags
          → routeTasks
          → generateResponse
          → long-reasoning (hidden insight)
```

### 4.3 Focus Selection Flow
```
suggest-focus called → Fetch tasks, profile, emotional state
                    → Apply context rules (time, mood, location)
                    → Filter by cognitive load
                    → Fetch domino effect data
                    → Apply companion mood weighting
                    → long-reasoning (explain WHY)
                    → Return suggestions
```

### 4.4 Learning Flow
```
User corrects AI → Save to ai_corrections
                → weekly-retraining (scheduled)
                → Compute learning profile
                → Update ai_memory_profiles
                → Future suggestions improved
```

---

## 5. Environment Variables

### Required Keys
| Key | Purpose | Used By |
|-----|---------|---------|
| `OPENAI_API_KEY` | OpenAI API access | Most edge functions |
| `LOVABLE_API_KEY` | Lovable AI Gateway | Newer functions |
| `SUPABASE_URL` | Supabase project URL | All functions |
| `SUPABASE_ANON_KEY` | Supabase anon key | Client access |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | Admin functions |
| `MAPBOX_PUBLIC_TOKEN` | Mapbox API | Location features |
| `VAPID_PRIVATE_KEY` | Push notifications | Notification functions |

### Client-Side (Vite)
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
```

---

## 6. Unused/Duplicate Code

### 6.1 Potential Duplicates

| Area | Files | Notes |
|------|-------|-------|
| Task Classification | `classify-tiny-task` vs `process-input/classify.ts` | Both classify tasks, slight overlap |
| Context Inference | `process-input/context.ts` vs task metadata in `extract-tasks` | Similar functionality |
| Priority Scoring | `process-input/score.ts` vs `score-task-priority` | Different approaches |
| Keyword Analysis | `suggest-keywords` | Rule-based, could overlap with AI |

### 6.2 Potentially Unused

| Item | Location | Status |
|------|----------|--------|
| `src/lib/ai/index.ts` | Does not exist | Directory exists but no index |
| Some persona variations | `chat-completion` archetypes | May not all be used |
| `global-trends-analyzer` | Edge function | Unclear usage |
| `thought-engine-trainer` | Edge function | Unclear usage |

### 6.3 Consolidation Opportunities

1. **Task Processing Pipeline**: Multiple functions handle similar tasks - could consolidate `extract-tasks`, `categorize-task`, and `classify-tiny-task` into a single orchestrator.

2. **AI Provider Standardization**: Mix of OpenAI and Lovable AI Gateway - consider standardizing on one for cost/consistency.

3. **Reasoning Engine**: `long-reasoning` is called by many functions - could benefit from caching or batching.

4. **Pattern Recognition**: Multiple functions analyze patterns (`pattern-recognition`, `preference-learner`, `behavior-predictor`) - could share more logic.

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total Edge Functions | 67 |
| AI-Powered Functions | ~35 |
| OpenAI Functions | ~20 |
| Lovable AI Functions | ~15 |
| Database Tables | 40+ |
| AI Learning Tables | 6 |
| System Prompts | 25+ |

---

*Last Updated: December 4, 2025*
