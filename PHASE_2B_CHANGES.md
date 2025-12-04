# Phase 2B: Rewire process-voice-input (Remove Chat Dependency)

**Date:** 2024-12-04  
**Status:** Complete

## Summary

Rewrote `supabase/functions/process-voice-input/index.ts` to remove all `chat-completion` calls. All intent routes now use structured analysis functions only.

## Routing Changes

### Before (Old Routing)
| Mode | Handler |
|------|---------|
| add_tasks | extract-tasks ✅ |
| request_suggestions | extract-tasks → chat-completion |
| journal | chat-completion |
| think_aloud | chat-completion |
| ask_question | chat-completion |
| request_help | chat-completion |

### After (New Routing)
| Mode | Handler |
|------|---------|
| add_tasks | extract-tasks ✅ (unchanged) |
| request_suggestions | suggest-focus → returns suggested tasks |
| journal | generate-journal-summary → reflection analysis |
| think_aloud | generate-journal-summary → treated as reflection |
| ask_question | Structured fallback (no AI chat) |
| request_help | Structured fallback (no AI chat) |

## Code Changes

### Lines 180-225 Rewritten

**journal / think_aloud:**
```typescript
// Route to generate-journal-summary for structured reflection analysis
const { data: journalResult } = await supabase.functions.invoke('generate-journal-summary', {
  body: {
    entries: [{ content: text, created_at: new Date().toISOString() }],
    timeframe: 'day',
  }
});
```

**request_suggestions:**
```typescript
// Route to suggest-focus for AI-powered task suggestions
const { data: suggestResult } = await supabase.functions.invoke('suggest-focus', {
  body: { locationContext: null }
});
```

**ask_question / request_help:**
```typescript
// Structured fallback - guides user to supported actions
reply_text = "I can help you add tasks, journal your thoughts, or suggest what to focus on.";
```

## What Was Removed

- ❌ `chat-completion` function invocation (line 203-210)
- ❌ Conversation history threading for chat responses
- ❌ Free-form conversational AI responses

## What Was Preserved

- ✅ Intent detection (gpt-4-turbo still classifies intent)
- ✅ Task extraction via `extract-tasks`
- ✅ Idea analysis via `idea-analyzer` (for insights)
- ✅ Rate limiting
- ✅ User authentication
- ✅ Error handling

## Behavior Changes

| Scenario | Old Behavior | New Behavior |
|----------|--------------|--------------|
| User asks "What should I do today?" | AI generates conversational answer | Routes to suggest-focus, returns task suggestions |
| User says "I'm feeling overwhelmed" | AI gives empathetic chat response | Routes to journal summary, returns reflection acknowledgment |
| User asks "How do I use this app?" | AI explains in conversation | Returns structured help message pointing to features |

## Testing Notes

1. **add_tasks:** Should work exactly as before
2. **journal:** Will now return a simpler acknowledgment + save insights
3. **request_suggestions:** Will return actual suggested tasks from user's task list
4. **ask_question:** Will return structured help message (not AI chat)

## Next Steps (Phase 2C)

- Delete the `chat-completion` edge function entirely
- Audit any other functions that might still import it
