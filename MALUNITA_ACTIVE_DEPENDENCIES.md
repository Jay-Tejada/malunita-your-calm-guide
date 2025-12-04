# MALUNITA ACTIVE DEPENDENCIES AUDIT

Generated: 2025-12-04

---

## 1. ACTIVE EDGE FUNCTION CALLS

### Called from React Components/Hooks (Frontend)

| Function Name | Called From | Purpose |
|--------------|-------------|---------|
| `transcribe-audio` | MalunitaVoice, ConversationalTaskFlow, DailySessionSteps, RemindersList, RunwayReview | Voice-to-text |
| `text-to-speech` | MalunitaVoice, ConversationalTaskFlow, RunwayReview | Text-to-voice |
| `extract-tasks` | MalunitaVoice, DailySessionSteps | Parse text into tasks |
| `chat-completion` | ConversationalTaskFlow, RemindersList, RunwayReview, MalunitaVoice | Conversational AI |
| `suggest-focus` | MalunitaVoice | Focus recommendations |
| `process-input` | QuickCapture | Main task intake pipeline |
| `process-voice-input` | MalunitaVoice | Voice pipeline |
| `categorize-task` | useCategorizeTaskMutation | Auto-categorization |
| `classify-tiny-task` | useClassifyTinyTask | Tiny task detection |
| `cluster-tasks` | useKnowledgeClusters (knowledgeClusters.ts) | Semantic clustering |
| `suggest-keywords` | CategoryKeywordTrainer | Keyword suggestions |
| `suggest-custom-category` | TaskConfirmation | Category suggestions |
| `suggest-goals` | GoalSuggestions | Goal recommendations |
| `suggest-tasks` | TaskSuggestions | Task suggestions |
| `suggest-micro-steps` | useMicroSuggestions | Micro-step breakdown |
| `split-tasks` | TaskCard | Task splitting |
| `batch-categorize-inbox` | InboxActions | Bulk categorization |
| `runway-review` | RunwayReview | Weekly review |
| `snooze-notifications` | NotificationSnooze | Notification management |
| `get-mapbox-token` | TaskGlobe, useMapboxToken | Map token |
| `generate-monthly-insights` | useMonthlyInsights (insightEngine.ts) | Monthly summaries |
| `generate-journal-summary` | useMemoryJournal | Journal AI summary |
| `malunita-personal-feed` | usePersonalFeed | Personalized insights |
| `focus-explainer` | useFocusExplainer | Focus explanations |
| `focus-memory-query` | primaryFocusPredictor | Focus memory retrieval |
| `planning-breakdown` | usePlanningBreakdown | Plan breakdown |
| `plan-tasks` | usePlanTasks | Plan generation |
| `long-reasoning` | longReasoningEngine.ts | Deep reasoning |
| `habit-predictor` | habitPredictor.ts | Habit predictions |
| `thought-engine-trainer` | TaskLearningDialog, MalunitaVoice, TaskCategoryFeedback | Learning feedback |
| `learn-writing-style` | MalunitaVoice | Style learning |
| `global-trends-analyzer` | TaskCategoryFeedback | Global trends |
| `analyze-domino-effect` | dominoEffectAnalyzer.ts | Task dependencies |

### Called from Other Edge Functions (Inter-function)

| Caller Function | Calls | Purpose |
|----------------|-------|---------|
| `auto-focus-check` | `focus-memory-store` | Store focus data |
| `daily-command-center` | `extract-tasks`, `analyze-domino-effect`, `long-reasoning` | Command center pipeline |
| `extract-tasks` | `long-reasoning` | Deep task extraction |
| `inbox-cleanup` | `idea-analyzer`, `categorize-task`, `classify-tiny-task` | Inbox processing |
| `process-voice-input` | `extract-tasks`, `idea-analyzer`, `chat-completion` | Voice pipeline |
| `send-task-reminders` | `send-push-notification` | Push notifications |
| `suggest-focus` | `analyze-domino-effect`, `long-reasoning` | Focus suggestions |
| `suggest-tasks` | `long-reasoning` | Task suggestions |
| `task-to-plan` | `score-task-priority`, `classify-tiny-task`, `categorize-task` | Plan creation |
| `time-blocker` | `score-task-priority`, `classify-tiny-task`, `categorize-task` | Time blocking |

---

## 2. UNUSED EDGE FUNCTIONS (Zero References)

These functions exist but have **NO frontend or inter-function calls**:

| Function Name | Status | Notes |
|--------------|--------|-------|
| `admin-stats` | ❌ UNUSED | Admin dashboard (no UI) |
| `auto-focus-check` | ⚠️ CRON ONLY? | May be scheduled job |
| `behavior-predictor` | ❌ UNUSED | No references found |
| `check-admin` | ❌ UNUSED | No references found |
| `check-priority-task` | ❌ UNUSED | No references found |
| `create-smart-notifications` | ⚠️ CRON ONLY? | May be scheduled |
| `daily-command-center` | ❌ UNUSED | No frontend calls |
| `daily-prioritization` | ❌ UNUSED | No references found |
| `daily-runway-reminder` | ⚠️ CRON ONLY? | May be scheduled |
| `deadline-watcher` | ⚠️ CRON ONLY? | May be scheduled |
| `focus-memory-store` | ⚠️ INTERNAL | Called by auto-focus-check |
| `generate-subtasks` | ❌ UNUSED | No references found |
| `generate-weekly-quests` | ❌ UNUSED | No references found |
| `idea-analyzer` | ⚠️ INTERNAL | Called by inbox-cleanup, process-voice-input |
| `inbox-cleanup` | ❌ UNUSED | No frontend calls |
| `pattern-recognition` | ❌ UNUSED | No references found |
| `personalization-agent` | ❌ UNUSED | No references found |
| `preference-learner` | ❌ UNUSED | No references found |
| `proactive-suggestions` | ❌ UNUSED | No references found |
| `process-ritual` | ❌ UNUSED | No references found |
| `quest-wrapper` | ❌ UNUSED | No references found |
| `score-task-priority` | ⚠️ INTERNAL | Called by task-to-plan, time-blocker |
| `send-push-notification` | ⚠️ INTERNAL | Called by send-task-reminders |
| `send-smart-notification-reminders` | ⚠️ CRON ONLY? | May be scheduled |
| `send-task-reminders` | ⚠️ CRON ONLY? | May be scheduled |
| `task-staleness-checker` | ❌ UNUSED | No references found |
| `task-to-plan` | ❌ UNUSED | No frontend calls |
| `time-blocker` | ❌ UNUSED | No frontend calls |
| `tomorrow-planner` | ❌ UNUSED | No references found |
| `travel-time-reminders` | ❌ UNUSED | No references found |
| `weekly-recommendations` | ❌ UNUSED | No references found |
| `weekly-retraining` | ⚠️ CRON ONLY? | May be scheduled |

### Summary:
- **~15 functions are completely unused**
- **~8 functions may only be cron jobs** (no direct calls)
- **~5 functions are internal only** (called by other functions)

---

## 3. DATABASE TABLES IN ACTIVE USE

### Heavily Used (10+ references)

| Table | Reference Count | Used For |
|-------|-----------------|----------|
| `tasks` | 50+ | Core task management |
| `profiles` | 60+ | User settings, companion state |
| `journal_entries` | 15+ | Journaling feature |
| `daily_sessions` | 10+ | Daily rituals |
| `custom_categories` | 10+ | User categories |
| `weekly_quests` | 10+ | Quest system |

### Moderately Used (3-9 references)

| Table | Reference Count | Used For |
|-------|-----------------|----------|
| `habit_logs` | 5+ | Habit tracking |
| `focus_streaks` | 3+ | Focus streak tracking |
| `priority_storms` | 5+ | Priority predictions |
| `daily_focus_history` | 4+ | Focus history |
| `memory_journal` | 6+ | AI memory journal |
| `task_learning_feedback` | 8+ | AI learning feedback |
| `conversation_history` | 3+ | Chat history |
| `ai_memory_profiles` | 3+ | AI memory |
| `focus_embeddings` | 3+ | Focus vectors |
| `exercise_sets` | 5+ | Gym tracking |
| `habits` | 4+ | Habit definitions |
| `habit_completions` | 3+ | Habit completions |
| `projects` | 5+ | Project management |
| `thoughts` | 4+ | Thought capture |
| `category_keywords` | 4+ | Category keywords |
| `push_subscriptions` | 3+ | Push notifications |

### Lightly Used (1-2 references)

| Table | Reference Count | Used For |
|-------|-----------------|----------|
| `ai_reasoning_log` | 1 | Reasoning logs |
| `capture_sessions` | 2 | Capture sessions |
| `malunita_backups` | 2 | Backup system |
| `hatching_moments` | 2 | Companion hatching |
| `flow_sessions` | 2 | Flow sessions |
| `task_history` | 2 | Task history |
| `recent_event_titles` | 2 | Recent events |
| `daily_one_thing` | 2 | Daily one thing |
| `smart_notifications` | 2 | Smart notifications |
| `personal_records` | 2 | Gym PRs |
| `workout_sessions` | 2 | Workout sessions |

---

## 4. ORPHANED/RARELY USED TABLES

Tables that exist but have **minimal or zero code references**:

| Table | Status | Notes |
|-------|--------|-------|
| `ai_corrections` | ⚠️ LOW USE | Only service role inserts |
| `model_confusion_matrix` | ⚠️ LOW USE | Only service role access |
| `learning_trends` | ⚠️ LOW USE | Only service role access |
| `training_queue` | ⚠️ LOW USE | Admin/service role only |
| `user_bias_patterns` | ⚠️ LOW USE | Service role managed |
| `pattern_insights` | ⚠️ LOW USE | Service role managed |
| `user_patterns` | ⚠️ LOW USE | Via RPC only |
| `memory_events` | ⚠️ LOW USE | Service role managed |
| `rate_limits` | ⚠️ INTERNAL | Rate limiting system |
| `user_roles` | ⚠️ INTERNAL | Admin roles |
| `api_usage_logs` | ⚠️ INTERNAL | Usage tracking |
| `task_reminders` | ⚠️ LOW USE | Reminder system |
| `inbox_cleanup_log` | ⚠️ LOW USE | Cleanup tracking |
| `tiny_task_fiesta_sessions` | ⚠️ LOW USE | Fiesta feature |
| `tomorrow_plan` | ❌ UNUSED? | No direct references found |

---

## 5. ENVIRONMENT VARIABLES

### Frontend (Vite)

| Variable | Used In | Status |
|----------|---------|--------|
| `VITE_SUPABASE_URL` | client.ts | ✅ ACTIVE |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client.ts | ✅ ACTIVE |
| `VITE_VAPID_PUBLIC_KEY` | Notifications.tsx | ✅ ACTIVE |

### Edge Functions (Deno)

| Variable | Used In | Status |
|----------|---------|--------|
| `SUPABASE_URL` | All functions | ✅ ACTIVE |
| `SUPABASE_ANON_KEY` | Most functions | ✅ ACTIVE |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin functions | ✅ ACTIVE |
| `OPENAI_API_KEY` | AI functions | ✅ ACTIVE |
| `LOVABLE_API_KEY` | AI functions | ✅ ACTIVE |
| `MAPBOX_PUBLIC_TOKEN` | get-mapbox-token | ✅ ACTIVE |
| `VAPID_PRIVATE_KEY` | Push notifications | ✅ ACTIVE |

---

## 6. POTENTIAL DEAD IMPORTS

### Common Patterns Found

Files with potentially unused imports (require manual verification):

1. **State files** importing unused utilities
   - `src/state/emotionalMemory.ts` - large file, some imports may be unused
   - `src/state/memoryEngine.ts` - complex state, check usage

2. **AI module files** with redundant imports
   - `src/ai/burnoutDetector.ts` - uses many external calls
   - `src/ai/focusPersonaModel.ts` - complex dependencies

3. **Components with commented features**
   - Files with `// TODO` or disabled features may have unused imports

---

## 7. CONSOLIDATION RECOMMENDATIONS

### ✅ DELETED (Phase 1 - 2025-12-04)

The following 16 edge functions were removed:

```
✅ DELETED: supabase/functions/admin-stats/
✅ DELETED: supabase/functions/behavior-predictor/
✅ DELETED: supabase/functions/check-admin/
✅ DELETED: supabase/functions/check-priority-task/
✅ DELETED: supabase/functions/generate-subtasks/
✅ DELETED: supabase/functions/generate-weekly-quests/
✅ DELETED: supabase/functions/pattern-recognition/
✅ DELETED: supabase/functions/personalization-agent/
✅ DELETED: supabase/functions/preference-learner/
✅ DELETED: supabase/functions/proactive-suggestions/
✅ DELETED: supabase/functions/process-ritual/
✅ DELETED: supabase/functions/quest-wrapper/
✅ DELETED: supabase/functions/task-staleness-checker/
✅ DELETED: supabase/functions/tomorrow-planner/
✅ DELETED: supabase/functions/travel-time-reminders/
✅ DELETED: supabase/functions/weekly-recommendations/
```

### ⚠️ DEPRECATED (Phase 2C - 2025-12-04)

```
⚠️ DEPRECATED: supabase/functions/chat-completion/ (DELETED)
```

### ⚠️ DEPRECATED (Phase 3A - 2025-12-04)

Functions serving deprecated tables:

```
⚠️ DEPRECATED: supabase/functions/thought-engine-trainer/ (tables: ai_corrections, etc.)
⚠️ DEPRECATED: supabase/functions/global-trends-analyzer/ (tables: learning_trends)
⚠️ DEPRECATED: supabase/functions/weekly-retraining/ (tables: ai_corrections, training_queue)
```

### ⚠️ DEPRECATED (Phase 3B - 2025-12-04)

Consolidated suggestion functions:

```
⚠️ DEPRECATED: supabase/functions/suggest-tasks/ → Use suggest-focus
⚠️ DEPRECATED: supabase/functions/suggest-goals/ → Use suggest-focus
⚠️ DEPRECATED: supabase/functions/suggest-micro-steps/ → Use planning-breakdown
⚠️ DEPRECATED: supabase/functions/score-task-priority/ (no active callers)
```

**Frontend references updated:**
- src/components/TaskSuggestions.tsx → suggest-focus
- src/components/GoalSuggestions.tsx → suggest-focus
- src/hooks/useMicroSuggestions.ts → planning-breakdown
- src/pages/TestAll.tsx → marked deprecated

### VERIFY BEFORE DELETING (May be cron/internal)

```
supabase/functions/auto-focus-check/
supabase/functions/create-smart-notifications/
supabase/functions/daily-command-center/
supabase/functions/daily-prioritization/
supabase/functions/daily-runway-reminder/
supabase/functions/deadline-watcher/
supabase/functions/inbox-cleanup/
supabase/functions/send-smart-notification-reminders/
supabase/functions/send-task-reminders/
supabase/functions/task-to-plan/
supabase/functions/time-blocker/
supabase/functions/weekly-retraining/
```

### KEEP - ESSENTIAL

```
supabase/functions/transcribe-audio/
supabase/functions/text-to-speech/
supabase/functions/extract-tasks/
supabase/functions/process-input/
supabase/functions/categorize-task/
supabase/functions/classify-tiny-task/
supabase/functions/cluster-tasks/
supabase/functions/suggest-focus/
supabase/functions/generate-journal-summary/
supabase/functions/generate-monthly-insights/
supabase/functions/malunita-personal-feed/
supabase/functions/get-mapbox-token/
```

---

## 8. TABLE CLEANUP CANDIDATES

### Consider Deprecating

| Table | Reason |
|-------|--------|
| `ai_corrections` | Learning system rarely used |
| `model_confusion_matrix` | ML metrics not displayed |
| `learning_trends` | No UI for this data |
| `training_queue` | Background job artifact |
| `user_bias_patterns` | Complex ML not utilized |
| `pattern_insights` | No consumer found |
| `memory_events` | Unclear purpose |
| `tomorrow_plan` | No references |

### Keep - Core Functionality

| Table | Reason |
|-------|--------|
| `tasks` | Core feature |
| `profiles` | User data |
| `journal_entries` | Active feature |
| `daily_sessions` | Ritual system |
| `custom_categories` | User personalization |
| `projects` | Organization |
| `habits` / `habit_completions` | Habit tracking |

---

*This audit provides the foundation for safe consolidation. Always test after removing dependencies.*
