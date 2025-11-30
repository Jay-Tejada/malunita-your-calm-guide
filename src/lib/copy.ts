/**
 * Human-friendly copy for the entire app
 * Everything should sound like a friend talking to you, not a robot
 */

export const copy = {
  // Loading states
  loading: {
    default: "One moment...",
    tasks: "Getting your tasks...",
    saving: "Saving...",
    thinking: "Thinking...",
    processing: "Working on it...",
    analyzing: "Taking a look...",
    generating: "Creating something for you...",
  },

  // Success messages
  success: {
    taskCreated: "Got it! Task added.",
    taskCompleted: "Nice! One down.",
    taskDeleted: "Task removed.",
    saved: "All set!",
    updated: "Updated!",
    signedIn: "Welcome back!",
    signedOut: "See you soon!",
    emailSent: "Check your email!",
  },

  // Error messages
  error: {
    generic: "Something went wrong. Mind trying again?",
    network: "Can't connect right now. Check your internet?",
    notFound: "Hmm, couldn't find that.",
    unauthorized: "You'll need to sign in first.",
    validation: "Looks like something's missing.",
    taskFailed: "Couldn't save that task. Try again?",
    loadFailed: "Had trouble loading that.",
  },

  // Empty states
  empty: {
    noTasks: "Nothing here yet",
    noResults: "Couldn't find anything",
    inbox: "All clear!",
    today: "Your day is wide open",
    completed: "Nothing finished yet",
  },

  // Buttons
  buttons: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    done: "Done",
    next: "Next",
    back: "Back",
    continue: "Continue",
    submit: "Submit",
    close: "Close",
    confirm: "Confirm",
    remove: "Remove",
    retry: "Try again",
    signIn: "Sign in",
    signUp: "Sign up",
    signOut: "Sign out",
    gotIt: "Got it",
    okay: "Okay",
    nope: "Nope",
    yeah: "Yeah",
    skip: "Skip",
  },

  // Placeholders
  placeholders: {
    task: "What's on your mind?",
    search: "Search...",
    email: "your@email.com",
    password: "Your password",
    name: "Your name",
    note: "Add a note...",
    journal: "What happened today?",
  },

  // Confirmations
  confirm: {
    deleteTask: "Delete this task?",
    deleteAll: "Delete everything?",
    signOut: "Sign out?",
    discard: "Discard changes?",
    archive: "Archive this?",
    complete: "Mark as done?",
  },

  // Time-based greetings
  greetings: {
    morning: "Good morning",
    afternoon: "Good afternoon",
    evening: "Good evening",
    night: "Hey night owl",
  },

  // Help text
  help: {
    markdown: "You can use **bold**, *italic*, and [links](url)",
    voice: "Tap and hold to speak",
    categories: "We'll organize this for you",
    focus: "Pick one thing to focus on today",
    oneThing: "What matters most today?",
  },

  // Validation
  validation: {
    required: "This one's required",
    email: "Need a valid email",
    password: "Password needs 6+ characters",
    tooShort: "A bit more detail?",
    tooLong: "That's too long",
  },

  // Auth
  auth: {
    signInPrompt: "Sign in to continue",
    signUpPrompt: "Create your account",
    forgotPassword: "Forgot password?",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    resetPassword: "Reset your password",
    checkEmail: "Check your email for a reset link",
    passwordReset: "Password reset!",
    createAccount: "Create account",
  },

  // States
  states: {
    working: "Working...",
    ready: "Ready",
    offline: "You're offline",
    syncing: "Syncing...",
    synced: "All synced up",
    saving: "Saving...",
    saved: "Saved",
    unsaved: "Unsaved changes",
  },

  // Companion
  companion: {
    listening: "I'm listening...",
    thinking: "Let me think...",
    speaking: "...",
    idle: "Hey there",
    happy: "😊",
    excited: "✨",
    sleepy: "😴",
  },

  // Task specific
  tasks: {
    overdue: "This is overdue",
    dueToday: "Due today",
    dueSoon: "Due soon",
    tiny: "Quick task",
    big: "Big one",
    mustDo: "Must do",
    shouldDo: "Should do",
    couldDo: "Could do",
    noDeadline: "No deadline",
  },
};

// Helper functions for dynamic copy
export const getCopy = {
  greeting: () => {
    const hour = new Date().getHours();
    if (hour < 12) return copy.greetings.morning;
    if (hour < 17) return copy.greetings.afternoon;
    if (hour < 21) return copy.greetings.evening;
    return copy.greetings.night;
  },

  loading: (context?: keyof typeof copy.loading) => {
    return context ? copy.loading[context] : copy.loading.default;
  },

  timeBasedMessage: (morning: string, afternoon: string, evening: string) => {
    const hour = new Date().getHours();
    if (hour < 12) return morning;
    if (hour < 17) return afternoon;
    return evening;
  },
};
