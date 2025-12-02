// Canonical exercise names with all known variations
const EXERCISE_ALIASES: Record<string, string[]> = {
  // Push movements
  'Push-Ups': ['push-ups', 'push ups', 'pushup', 'pushups', 'push up'],
  'Bench Press': ['bench', 'bench press', 'flat bench', 'barbell bench', 'bb bench'],
  'Incline Bench Press': ['incline bench', 'incline press', 'incline bb'],
  'Dumbbell Press': ['db press', 'dumbbell press', 'db bench'],
  'Overhead Press': ['ohp', 'overhead press', 'shoulder press', 'military press'],
  'Dips': ['dips', 'dip', 'tricep dips', 'chest dips'],
  
  // Pull movements
  'Pull-Ups': ['pull-ups', 'pull ups', 'pullup', 'pullups', 'pull up'],
  'Chin-Ups': ['chin-ups', 'chin ups', 'chinup', 'chinups', 'chin up'],
  'Rows': ['rows', 'row', 'barbell row', 'bb row'],
  'Dumbbell Rows': ['db rows', 'db row', 'dumbbell row', 'dumbbell rows'],
  'Lat Pulldown': ['lat pulldown', 'pulldown', 'lat pull down', 'pull down'],
  'Face Pulls': ['face pulls', 'face pull', 'facepull'],
  
  // Legs
  'Squats': ['squats', 'squat', 'back squat', 'back squats', 'bb squat'],
  'Front Squats': ['front squat', 'front squats'],
  'Deadlift': ['deadlift', 'deadlifts', 'dl', 'conventional deadlift'],
  'Romanian Deadlift': ['rdl', 'romanian deadlift', 'rdls', 'romanian deadlifts'],
  'Lunges': ['lunges', 'lunge', 'walking lunges', 'walking lunge'],
  'Leg Press': ['leg press', 'legpress'],
  'Leg Curl': ['leg curl', 'leg curls', 'hamstring curl'],
  'Leg Extension': ['leg extension', 'leg extensions', 'quad extension'],
  'Calf Raises': ['calf raises', 'calf raise', 'calves', 'standing calf raise'],
  
  // Core
  'Plank': ['plank', 'planks', 'front plank'],
  'Sit-Ups': ['sit-ups', 'sit ups', 'situp', 'situps', 'sit up'],
  'Crunches': ['crunches', 'crunch', 'ab crunch'],
  'Russian Twists': ['russian twist', 'russian twists'],
  'Leg Raises': ['leg raises', 'leg raise', 'hanging leg raise'],
  'Mountain Climbers': ['mountain climbers', 'mountain climber'],
  
  // Arms
  'Bicep Curls': ['bicep curls', 'bicep curl', 'curls', 'curl', 'bb curl', 'barbell curl'],
  'Dumbbell Curls': ['db curls', 'db curl', 'dumbbell curl', 'dumbbell curls'],
  'Hammer Curls': ['hammer curls', 'hammer curl'],
  'Tricep Pushdown': ['tricep pushdown', 'pushdown', 'pushdowns', 'cable pushdown'],
  'Skull Crushers': ['skull crushers', 'skull crusher', 'skullcrushers'],
  
  // Cardio / Other
  'Burpees': ['burpees', 'burpee'],
  'Jumping Jacks': ['jumping jacks', 'jumping jack', 'jj'],
  'Box Jumps': ['box jumps', 'box jump'],
  'Jump Rope': ['jump rope', 'skipping', 'rope'],
  'Running': ['running', 'run', 'jog', 'jogging'],
  'Walking': ['walking', 'walk'],
};

// Build reverse lookup map
const buildAliasMap = (): Map<string, string> => {
  const map = new Map<string, string>();
  
  Object.entries(EXERCISE_ALIASES).forEach(([canonical, aliases]) => {
    // Add canonical name itself
    map.set(canonical.toLowerCase(), canonical);
    // Add all aliases
    aliases.forEach(alias => {
      map.set(alias.toLowerCase(), canonical);
    });
  });
  
  return map;
};

const ALIAS_MAP = buildAliasMap();

// Simple fuzzy matching
const findClosestMatch = (input: string): string | null => {
  const inputNormalized = input.replace(/[-\s]/g, '').toLowerCase();
  
  for (const [alias, canonical] of ALIAS_MAP.entries()) {
    const aliasNormalized = alias.replace(/[-\s]/g, '');
    
    // Check if input contains the alias or vice versa
    if (inputNormalized.includes(aliasNormalized) || aliasNormalized.includes(inputNormalized)) {
      // Only match if reasonably close in length (avoid "push" matching "push-ups")
      if (Math.abs(inputNormalized.length - aliasNormalized.length) <= 3) {
        return canonical;
      }
    }
  }
  
  return null;
};

// Format unknown exercise nicely
const formatAsNewExercise = (input: string): string => {
  return input
    .trim()
    .split(/[\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Normalize an exercise name
export const normalizeExerciseName = (input: string): string => {
  const cleaned = input.trim().toLowerCase();
  
  // Direct match in alias map
  if (ALIAS_MAP.has(cleaned)) {
    return ALIAS_MAP.get(cleaned)!;
  }
  
  // Fuzzy match - find closest
  const closest = findClosestMatch(cleaned);
  if (closest) {
    return closest;
  }
  
  // No match found - format as title case (new exercise)
  return formatAsNewExercise(input);
};

// Get all canonical exercise names (for autocomplete)
export const getAllExercises = (): string[] => {
  return Object.keys(EXERCISE_ALIASES).sort();
};

// Search exercises for autocomplete
export const searchExercises = (query: string): string[] => {
  if (!query || query.length < 2) return [];
  
  const q = query.toLowerCase();
  const results: string[] = [];
  
  // First: exact prefix matches on canonical names
  Object.keys(EXERCISE_ALIASES).forEach(canonical => {
    if (canonical.toLowerCase().startsWith(q)) {
      results.push(canonical);
    }
  });
  
  // Second: contains matches
  Object.keys(EXERCISE_ALIASES).forEach(canonical => {
    if (!results.includes(canonical) && canonical.toLowerCase().includes(q)) {
      results.push(canonical);
    }
  });
  
  // Third: alias matches
  ALIAS_MAP.forEach((canonical, alias) => {
    if (!results.includes(canonical) && alias.includes(q)) {
      results.push(canonical);
    }
  });
  
  return results.slice(0, 5); // Top 5 results
};
