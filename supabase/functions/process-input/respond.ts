/**
 * Generate contextual, empathetic responses based on user input
 */

interface ResponseContext {
  emotion: string;
  taskCount: number;
  hasLargeTasks: boolean;
  tasks: Array<{ title: string; cleaned: string; isTiny: boolean }>;
  originalText: string;
}

const STRESS_KEYWORDS = [
  'overwhelmed', 'stressed', 'anxious', 'worried', 'panic',
  'too much', 'can\'t handle', 'drowning', 'exhausted', 'burnt out'
];

const LARGE_TASK_THRESHOLD = 50; // characters

export function generateResponse(context: ResponseContext): string {
  const { emotion, taskCount, hasLargeTasks, tasks, originalText } = context;
  
  // 1. Detect stress and respond with empathy
  if (emotion === 'stressed' || detectStress(originalText)) {
    if (taskCount > 0) {
      return `I hear you — that's a lot on your mind. Let's start with just ONE thing. ${tasks[0]?.cleaned || 'Pick your most important task'} seems like a good place to focus.`;
    }
    return `I can sense things feel heavy right now. Take a breath. What's the ONE thing that would make today feel lighter?`;
  }

  // 2. Detect many tasks and offer help
  if (taskCount >= 5) {
    return `Wow, that's ${taskCount} things! Let me help you break these down. I've routed them by priority — want me to suggest which one to start with?`;
  }

  // 3. Detect large/complex tasks
  if (hasLargeTasks) {
    const largeTask = tasks.find(t => t.cleaned.length > LARGE_TASK_THRESHOLD);
    if (largeTask) {
      return `"${largeTask.cleaned}" feels big. What's the smallest first step you could take right now? Even 5 minutes counts.`;
    }
  }

  // 4. Positive/motivated state
  if (emotion === 'motivated' || emotion === 'ok') {
    if (taskCount === 1) {
      return `Got it! I've added that for you. ${tasks[0]?.isTiny ? 'Quick win — you can knock this out fast! 🚀' : 'Want to break it down into smaller steps?'}`;
    }
    if (taskCount > 1 && taskCount < 5) {
      return `Nice — ${taskCount} things captured. I've organized them by priority. Ready to dive in?`;
    }
  }

  // 5. Generic but warm fallback
  if (taskCount === 1) {
    return `Added! ${tasks[0]?.isTiny ? 'This one is quick — perfect for momentum.' : 'I have got this on your radar.'}`;
  }
  
  if (taskCount > 1) {
    return `All set — ${taskCount} tasks organized and ready. What feels most important right now?`;
  }

  return `I have captured that. Anything else on your mind?`;
}

function detectStress(text: string): boolean {
  const lowerText = text.toLowerCase();
  return STRESS_KEYWORDS.some(keyword => lowerText.includes(keyword));
}
