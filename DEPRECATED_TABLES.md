# Deprecated Tables - Phase 3A

**Date Flagged:** 2024-12-04  
**Status:** Write operations disabled, reads still active

## Overview

These tables are flagged for removal. All write operations have been stopped. Read operations may still exist for backwards compatibility but will be removed in Phase 3B.

## Deprecated Tables

| Table | Purpose | Write Status | Read Status |
|-------|---------|--------------|-------------|
| ai_corrections | Store AI correction data | ❌ Deprecated | 📖 Active |
| model_confusion_matrix | Track AI prediction errors | ❌ Deprecated | 📖 Active |
| learning_trends | Global learning patterns | ❌ Deprecated | 📖 Active |
| training_queue | Queue for ML training jobs | ❌ Deprecated | None |
| user_bias_patterns | User-specific AI patterns | ❌ Deprecated | 📖 Active |
| pattern_insights | Pattern analysis results | ❌ Deprecated | None |
| memory_events | Event logging for analytics | ❌ Deprecated | None |
| user_patterns | User behavior patterns | ❌ Deprecated | 📖 Active |
| tomorrow_plan | Next-day planning | ❌ Deprecated | 📖 Active (daily-command-center) |

## Deprecated Edge Functions

These functions primarily write to deprecated tables and are now deprecated:

| Function | Tables Used | Status |
|----------|-------------|--------|
| thought-engine-trainer | ai_corrections, model_confusion_matrix, user_bias_patterns, learning_trends, memory_events, training_queue | ⚠️ DEPRECATED |
| global-trends-analyzer | learning_trends | ⚠️ DEPRECATED |
| weekly-retraining | ai_corrections, training_queue | ⚠️ DEPRECATED |

## Files with Read Operations (Still Active)

These files contain SELECT queries to deprecated tables. They will be cleaned up in Phase 3B:

### src/hooks/useAILearning.ts
- Reads: ai_corrections, learning_trends, user_bias_patterns, model_confusion_matrix
- Purpose: Display learning dashboard data

### src/hooks/usePredictiveLoad.ts
- Reads: ai_corrections (prefetch)
- Purpose: Predictive loading optimization

### src/hooks/useUserPatterns.ts
- Reads: user_patterns
- Purpose: User behavior analysis

### src/pages/Learning.tsx
- Reads: ai_corrections
- Purpose: Learning page display

### supabase/functions/daily-command-center/index.ts
- Reads: tomorrow_plan
- Purpose: Get suggested focus task

## Migration Plan

### Phase 3B (Next)
1. Remove read operations from frontend hooks
2. Delete deprecated edge functions
3. Update daily-command-center to not use tomorrow_plan

### Phase 3C (Final)
1. Drop deprecated tables from database
2. Remove types from types.ts (auto-generated)
3. Final cleanup

## Notes

- The `conversation_history` table was already deprecated in Phase 2C
- Tables are NOT dropped yet - only writes are stopped
- Read operations continue to prevent UI errors
- Full table drops will happen after read operations are removed
