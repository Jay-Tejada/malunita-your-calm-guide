# Pattern Awareness Enhancement — Complete

**Date:** December 6, 2025

---

## Overview

Added quiet pattern observation to Malunita's night ritual. No advice. No encouragement. Just factual observations about user behavior over the last 14 days.

---

## New Components

### Edge Function
- `supabase/functions/detect-patterns/index.ts`
  - Analyzes ritual_history + completed tasks
  - Computes local stats (no AI needed for basics)
  - Generates single neutral observation via GPT-4o-mini
  - Returns trend indicator: improving | steady | declining | unclear

### React Hook
- `src/hooks/usePatternAwareness.ts`
  - `detectPatterns()` → calls edge function
  - Returns `PatternResult` with observation, trend, and stats

### UI Component
- `src/components/insights/PatternObservation.tsx`
  - Minimal display with trend arrow (↗ → ↘ ·)
  - Uses semantic design tokens

---

## Integration Points

### Evening Ritual
- Pattern detection runs alongside night insight
- Displays after RitualInsightCard if patterns exist
- Both fetched in parallel for performance

### Orb Evolution
- Added `ritualConsistency` metric to evolution checks
- Counts rituals in last 14 days
- Can be used for evolution threshold bonuses

---

## Data Flow

```
User opens Evening Ritual
        ↓
Promise.all([getNightInsight(), detectPatterns()])
        ↓
detect-patterns edge function:
  1. Fetch ritual_history (14 days)
  2. Fetch completed tasks (14 days)
  3. Compute local stats
  4. If sufficient data → GPT-4o-mini generates observation
  5. Return { has_patterns, observation, trend, stats }
        ↓
Display PatternObservation component
```

---

## Example Observations

- "You complete more tasks on Tuesdays than any other day."
- "Most of your completed work is in the home category."
- "You've done morning rituals 5 of the last 7 days."
- "Tiny tasks make up 40% of your completions."

---

## Philosophy Alignment

| Principle | Implementation |
|-----------|----------------|
| Silent AI | One sentence, no advice |
| Factual | Stats-based, not opinion |
| Minimal | Single observation per ritual |
| Non-intrusive | Only shown if patterns exist |

---

## Files Created

- `supabase/functions/detect-patterns/index.ts`
- `src/hooks/usePatternAwareness.ts`
- `src/components/insights/PatternObservation.tsx`
- `PATTERN_AWARENESS_COMPLETE.md`

## Files Modified

- `supabase/config.toml` — added detect-patterns function
- `src/features/rituals/EveningRitual.tsx` — integrated pattern display
- `src/lib/orbEvolution.ts` — added ritualConsistency metric

---

## Stats Tracked (No AI Required)

- `completed_last_14_days` — task completion count
- `tiny_tasks_completed` — tiny task count
- `morning_rituals` — morning ritual count
- `night_rituals` — night ritual count
- `top_category` — most completed category
- `most_productive_day` — day with most completions
- `active_task_count` — current open tasks

---

*Pattern awareness: seeing without judging.*
