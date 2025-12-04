# Phase 4C Complete - Ritual Integration & Evolution Logic

**Date:** 2024-12-04

## Part 1: Ritual Triggers Hook

Created `src/hooks/useOrbRituals.ts`:

| Trigger | Action | Effect |
|---------|--------|--------|
| `onStartMyDay()` | Morning energy boost | mood → morning, energy → 4, auto-reset after 3s |
| `onEndMyDay()` | Evening wind-down | mood → evening, energy → 2 |
| `onTinyTaskFiestaStart()` | Max energy | energy → 5 |
| `onTinyTaskFiestaComplete(count)` | Celebration if ≥3 tasks | triggerCelebration() |
| `onFocusSessionStart()` | Focus mode | mood → focused, energy → 4 |
| `onFocusSessionEnd()` | Completion celebration | mood → idle + celebration |

## Part 2: Evolution Logic

Created `src/lib/orbEvolution.ts`:

### Stage Thresholds:
| Stage | Tasks Required | Days Active |
|-------|---------------|-------------|
| 2 | 25 | 3 |
| 3 | 75 | 7 |
| 4 | 150 | 14 |
| 5 | 300 | 30 |
| 6 | 500 | 60 |
| 7 | 1000 | 90 |

### Functions:
- `checkEvolution(userId, currentStage, metrics)` - Returns if orb should evolve
- `fetchEvolutionMetrics(userId)` - Fetches task/session counts from DB
- `saveEvolution(userId, newStage)` - Persists new stage to profiles table

## Part 3: Evolution Check Hook

Created `src/hooks/useOrbEvolution.ts`:
- Checks evolution eligibility on mount
- Rechecks every 5 minutes
- Auto-triggers evolve animation when threshold met
- Persists new stage to database

## Part 4: App Integration

Updated `src/components/Layout.tsx`:
- Added useOrbSync hook (time-of-day sync)
- Added useOrbEvolution hook (evolution checks)
- Gets userId from auth on mount

## Part 5: Ritual Trigger Points (TODOs)

Added TODO comments for future wiring:

| File | Location | Trigger |
|------|----------|---------|
| `MorningRitual.tsx` | After ritual complete | `onStartMyDay()` |
| `EveningRitual.tsx` | After reflection | `onEndMyDay()` |
| `TinyTaskFiestaStart.tsx` | After session created | `onTinyTaskFiestaStart()` |
| `TinyTaskFiesta.tsx` | On timer complete | `onTinyTaskFiestaComplete(count)` |
| `useFlowSessions.ts` | startSession (Phase 4B) | `onFocusStart()` |
| `useFlowSessions.ts` | completeSession (Phase 4B) | `onFocusEnd()` |

## Files Created

- `src/hooks/useOrbRituals.ts`
- `src/lib/orbEvolution.ts`
- `src/hooks/useOrbEvolution.ts`

## Files Modified

- `src/components/Layout.tsx` - Added orb hooks
- `src/features/rituals/MorningRitual.tsx` - TODO added
- `src/features/rituals/EveningRitual.tsx` - TODO added
- `src/components/TinyTaskFiestaStart.tsx` - TODO added
- `src/pages/TinyTaskFiesta.tsx` - TODO added

## Build Status

- ✅ TypeScript: No errors
- ✅ Build: Successful

## Next Steps

- Phase 4D: Wire up all TODO triggers with actual hook calls
- Phase 4E: Mount LivingOrbV2 component in UI
- Phase 4F: Add evolution celebration cutscene
