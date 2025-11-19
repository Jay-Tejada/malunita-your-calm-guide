# 🌟 Malunita Workflow Rituals

Intelligent, time-based workflow orchestration without adding UI screens. Uses existing components and Thought Engine 2.0.

## Overview

The Workflow Rituals system automatically guides users through their day using context-aware notifications and intelligent task routing. All rituals run invisibly in the background and surface only when needed.

## Rituals

### 🌅 Morning Ritual (6am - 10am)
**Triggers:** First app open between 6am-10am
**Runs:** Once per day

**What it does:**
- Analyzes all incomplete tasks using Thought Engine 2.0
- Routes tasks via `agendaRouter` (today/tomorrow/this week/upcoming/someday)
- Scores priorities using `priorityScorer`
- Identifies context using `contextMapper`
- Presents:
  - Total tasks for today
  - Top 3 MUST tasks
  - 1 Big Task recommendation
  - Tiny Task Fiesta suggestion (if 3+ tiny tasks available)

**UI:** Toast notification with 10-second duration
**Storage:** Logged to `conversation_history` table

---

### 📘 Midday Check-in (12pm - 3pm)
**Triggers:** Once between 12pm-3pm
**Runs:** Once per day

**What it does:**
- Counts tasks completed today
- Identifies remaining important tasks for today
- Provides brief status snapshot

**UI:** Toast notification with 7-second duration
**Tone:** Brief and encouraging

---

### 🌙 Evening Shutdown (6pm - 10pm)
**Triggers:** Once between 6pm-10pm
**Runs:** Once per day

**What it does:**
- Summarizes tasks completed today
- Identifies incomplete tasks from today
- **Auto-rolls over** up to 5 incomplete tasks to tomorrow's focus
- Provides gentle close-out message

**UI:** Toast notification with 8-second duration
**Storage:** Logged to `conversation_history` table
**Tone:** Calm and restorative

---

### 🗓️ Weekly Reset (Sunday 8am - 12pm)
**Triggers:** Sunday morning, once per week
**Runs:** Once per week

**What it does:**
- Analyzes completed tasks from past 7 days
- Identifies "biggest wins" (high-priority or long-form tasks)
- Flags stuck tasks (created >7 days ago, still incomplete)
- **Auto-cleans** completed tasks older than 30 days
- Provides weekly summary and next-week focus guidance

**UI:** Toast notification with 12-second duration
**Storage:** Logged to `conversation_history` table
**Maintenance:** Deletes stale completed tasks

---

## Technical Architecture

### Core Hook: `useWorkflowRituals`

Located: `src/hooks/useWorkflowRituals.ts`

**State Management:**
- Uses `localStorage` to track ritual state
- Resets daily flags at midnight
- Prevents duplicate triggers

**Dependencies:**
- `useProfile` - User preferences and settings
- `useTasks` - Task data and operations
- `useToast` - UI notifications
- `agendaRouter` - Task time-bucketing
- `priorityScorer` - Task prioritization
- `contextMapper` - Context extraction

**Trigger Logic:**
- Checks on mount
- Checks every 15 minutes via `setInterval`
- Uses time-based conditionals (hour of day, day of week)

### Integration

Added to: `src/pages/Index.tsx`

```typescript
import { useWorkflowRituals } from "@/hooks/useWorkflowRituals";

// Inside Index component:
useWorkflowRituals();
```

**That's it.** No UI changes, no new screens. Just intelligent behavior.

---

## Design Principles

### ✅ DO
- Use existing UI components (toast notifications)
- Keep messages concise and calm
- Auto-handle routine maintenance (rollover, cleanup)
- Log important rituals to conversation history
- Respect user time (once-per-day triggers)

### ❌ DON'T
- Create new screens or modals
- Interrupt user during active voice input
- Trigger more than once per time window
- Overwhelm with excessive notifications
- Use aggressive or nagging language

---

## Storage & Privacy

**Local Storage:**
- `malunita_ritual_state` - Tracks daily ritual state
- Reset daily at midnight
- No sensitive data stored

**Database:**
- Morning and Evening rituals logged to `conversation_history`
- Uses `role: 'assistant'` for ritual messages
- Session IDs: `morning-{timestamp}`, `evening-{timestamp}`, `weekly-{timestamp}`

---

## Customization

### Disable Rituals
Users can disable via profile settings (future feature):
```sql
-- Add to profiles table
ALTER TABLE profiles ADD COLUMN rituals_enabled BOOLEAN DEFAULT true;
```

### Adjust Timing
Edit `useWorkflowRituals.ts`:
```typescript
// Change time windows
if (hour >= 6 && hour < 10) // Morning
if (hour >= 12 && hour < 15) // Midday
if (hour >= 18 && hour < 22) // Evening
```

### Customize Messages
All messages generated in ritual functions:
- `triggerMorningRitual()`
- `triggerMiddayCheckIn()`
- `triggerEveningShutdown()`
- `triggerWeeklyReset()`

---

## Future Enhancements

### Push Notifications
Could integrate with existing push notification system:
- Send ritual messages via push when app not open
- Use `send-push-notification` edge function
- Requires push subscription setup

### Smart Notification Cards
Could use `SmartNotificationCard` component instead of toasts:
- More persistent than toasts
- Can be dismissed by user
- Already exists in codebase

### Personalization
Could adapt based on user behavior:
- Learn preferred morning time
- Adjust message tone based on completion patterns
- Skip rituals when user is on vacation

---

## Testing

### Manual Trigger (Development)
Add to Index.tsx for testing:
```typescript
const { 
  triggerMorningRitual,
  triggerMiddayCheckIn,
  triggerEveningShutdown,
  triggerWeeklyReset 
} = useWorkflowRituals();

// Add buttons for testing
<Button onClick={triggerMorningRitual}>Test Morning</Button>
```

### Time Simulation
Change system clock to test time-based triggers:
- Morning: Set time to 8:00 AM
- Midday: Set time to 1:00 PM
- Evening: Set time to 7:00 PM
- Weekly: Set day to Sunday, time to 9:00 AM

### State Reset
Clear localStorage to reset ritual state:
```javascript
localStorage.removeItem('malunita_ritual_state');
```

---

## Integration with Thought Engine 2.0

All rituals use the complete Thought Engine pipeline:

1. **Extract tasks** - Current incomplete tasks
2. **Analyze context** - `contextMapper` extracts projects, deadlines, people
3. **Score priorities** - `priorityScorer` assigns MUST/SHOULD/COULD + effort
4. **Route agenda** - `agendaRouter` assigns to today/tomorrow/this week/upcoming/someday
5. **Generate insights** - Rituals compose human-friendly summaries
6. **Deliver calmly** - Toast notifications with appropriate timing

This ensures rituals are **intelligent**, not mechanical.

---

## Philosophy

> "A calm digital notebook with intelligence layered on top."

Rituals are designed to:
- **Reduce cognitive load** - You don't need to remember to plan
- **Create structure** - Morning, midday, evening, weekly rhythms
- **Stay invisible** - No nagging, no interruptions, no modal hell
- **Build momentum** - Small, consistent nudges toward clarity

They embody Malunita's core principle: **calm intelligence, not productivity theater**.
