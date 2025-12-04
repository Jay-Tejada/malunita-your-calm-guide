# Malunita AI Architecture

## Final State After Phase 3 Cleanup

**Date:** 2024-12-04  
**Total Active Functions:** 39 (down from ~50+)  
**Deprecated Functions Deleted:** 10 in Phase 3C

---

## Core AI Functions (ACTIVE)

### Input Processing Layer
| Function | Purpose | Primary Caller |
|----------|---------|----------------|
| `process-input` | Main text processing pipeline | Frontend task creation |
| `process-voice-input` | Voice-to-text analysis | Voice components |
| `extract-tasks` | Parse text into task objects | process-input |
| `transcribe-audio` | Audio transcription | Voice components |

### Task Intelligence Layer
| Function | Purpose | Primary Caller |
|----------|---------|----------------|
| `categorize-task` | AI category assignment | process-input, frontend |
| `classify-tiny-task` | Identify quick wins | process-input, frontend |
| `suggest-focus` | **Primary suggestion engine** | Frontend, consolidated from suggest-* |
| `suggest-keywords` | Extract keywords from tasks | Task creation |
| `suggest-custom-category` | Recommend custom categories | Category management |

### Planning & Breakdown Layer
| Function | Purpose | Primary Caller |
|----------|---------|----------------|
| `planning-breakdown` | Break large tasks into steps | Frontend planning |
| `plan-tasks` | Multi-task planning | Project planning |
| `split-tasks` | Divide complex tasks | Task editing |

### Focus & Memory Layer
| Function | Purpose | Primary Caller |
|----------|---------|----------------|
| `focus-memory-store` | Store focus patterns | Focus completion |
| `focus-memory-query` | Query historical focus | suggest-focus |
| `focus-explainer` | Explain focus recommendations | Focus UI |
| `analyze-domino-effect` | Track task unlocks | Completion events |
| `cluster-tasks` | Group related tasks | Organization features |

### Notification & Reminder Layer
| Function | Purpose | Primary Caller |
|----------|---------|----------------|
| `send-push-notification` | Send push notifications | Various triggers |
| `send-task-reminders` | Scheduled task reminders | Cron/scheduler |
| `send-smart-notification-reminders` | AI-timed reminders | Cron/scheduler |
| `snooze-notifications` | Manage notification snooze | Frontend |
| `create-smart-notifications` | Generate smart alerts | AI analysis |
| `deadline-watcher` | Monitor approaching deadlines | Cron/scheduler |
| `daily-runway-reminder` | Daily runway check | Cron/scheduler |

### Analysis & Insights Layer
| Function | Purpose | Primary Caller |
|----------|---------|----------------|
| `generate-journal-summary` | Summarize journal entries | Journal feature |
| `generate-monthly-insights` | Monthly productivity report | Insights page |
| `runway-review` | Review task runway | Dashboard |
| `batch-categorize-inbox` | Bulk inbox categorization | Inbox cleanup |
| `long-reasoning` | Extended AI reasoning | Complex analysis |

### User Learning Layer
| Function | Purpose | Primary Caller |
|----------|---------|----------------|
| `learn-writing-style` | Adapt to user writing | Background learning |
| `habit-predictor` | Predict habit patterns | Habit features |
| `auto-focus-check` | Auto-focus recommendations | Background check |
| `malunita-personal-feed` | Personalized content | Dashboard |

### Utility Layer
| Function | Purpose | Primary Caller |
|----------|---------|----------------|
| `text-to-speech` | TTS for responses | Voice features |
| `get-mapbox-token` | Location services | Map features |

---

## Deprecated Functions (Phase 3)

### Deleted in Phase 3C (this phase):
- `suggest-tasks` → Consolidated to `suggest-focus`
- `suggest-goals` → Consolidated to `suggest-focus`
- `suggest-micro-steps` → Consolidated to `planning-breakdown`
- `idea-analyzer` → Removed (callers deprecated)
- `score-task-priority` → Removed (callers unused)
- `task-to-plan` → Removed (unused feature)
- `time-blocker` → Removed (unused feature)
- `inbox-cleanup` → Removed (local fallback added)
- `daily-command-center` → Removed (consolidated to suggest-focus)
- `daily-prioritization` → Removed (consolidated to suggest-focus)

### Deprecated but NOT Deleted (serving deprecated tables):
- `thought-engine-trainer` → Writes to deprecated tables
- `global-trends-analyzer` → Writes to deprecated tables
- `weekly-retraining` → Writes to deprecated tables

---

## Data Flow

```
User Input
    ↓
[process-input] or [process-voice-input]
    ↓
[extract-tasks] → Tasks parsed
    ↓
[categorize-task] + [classify-tiny-task] → Enrichment
    ↓
[suggest-focus] → AI recommendations
    ↓
Database → tasks table
    ↓
[focus-memory-store] → Pattern learning
```

---

## Frontend Integration Points

### Active Hooks/Components → Functions:
- `useProcessInput` → `process-input`
- `useFocusSuggestions` → `suggest-focus`
- `usePlanningBreakdown` → `planning-breakdown`
- `useVoiceInput` → `process-voice-input`, `transcribe-audio`
- `useCategorization` → `categorize-task`
- `useNotifications` → `send-push-notification`

### Deprecated Hooks (use local fallbacks):
- `useDailyIntelligence` → Local fallback
- `useDailyMindstream` → Partial (uses suggest-focus only)
- `useInboxCleanup` → Local categorization
- `useTaskPlan` → Returns null
- `useTimeBlocker` → Returns empty blocks
- `useWorkflowRituals` → Local fallback messages

---

## Next Steps (Phase 4+)

1. **Delete deprecated edge functions** (thought-engine-trainer, global-trends-analyzer, weekly-retraining)
2. **Drop deprecated database tables** 
3. **Remove dead code from frontend hooks**
4. **Implement Orb State Foundation** for silent companion

---

## Function Count Summary

| Category | Count |
|----------|-------|
| Input Processing | 4 |
| Task Intelligence | 5 |
| Planning | 3 |
| Focus & Memory | 5 |
| Notifications | 7 |
| Analysis | 6 |
| User Learning | 4 |
| Utility | 2 |
| **Total Active** | **36** |
| Deprecated (not deleted) | 3 |
| **Grand Total** | **39** |
