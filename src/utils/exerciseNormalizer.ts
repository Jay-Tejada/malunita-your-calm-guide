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
  'Barbell Rows': ['rows', 'row', 'barbell row', 'bb row', 'bent over row'],
  'Dumbbell Rows': ['db rows', 'db row', 'dumbbell row', 'dumbbell rows'],
  'Lat Pulldown': ['lat pulldown', 'pulldown', 'lat pull down', 'pull down'],
  'Face Pulls': ['face pulls', 'face pull', 'facepull'],
  
  // Legs
  'Squats': ['squats', 'squat', 'back squat', 'back squats', 'bb squat'],
  'Front Squats': ['front squat', 'front squats'],
  'Deadlift': ['deadlift', 'deadlifts', 'dl', 'conventional deadlift'],
  'Romanian Deadlift': ['rdl', 'romanian deadlift', 'rdls', 'romanian deadlifts', 'stiff leg deadlift'],
  'Lunges': ['lunges', 'lunge', 'walking lunges', 'walking lunge'],
  'Leg Press': ['leg press', 'legpress'],
  'Leg Curl': ['leg curl', 'leg curls', 'hamstring curl', 'ham curl'],
  'Leg Extension': ['leg extension', 'leg extensions', 'quad extension'],
  'Calf Raises': ['calf raises', 'calf raise', 'calves', 'standing calf raise', 'seated calf raise'],
  'Hip Thrust': ['hip thrust', 'hip thrusts', 'glute bridge', 'barbell hip thrust'],
  'Bulgarian Split Squat': ['bulgarian split squat', 'bss', 'split squat'],
  
  // Core
  'Plank': ['plank', 'planks', 'front plank'],
  'Side Plank': ['side plank', 'side planks'],
  'Sit-Ups': ['sit-ups', 'sit ups', 'situp', 'situps', 'sit up'],
  'Crunches': ['crunches', 'crunch', 'ab crunch', 'ab crunches'],
  'Russian Twists': ['russian twist', 'russian twists'],
  'Leg Raises': ['leg raises', 'leg raise', 'hanging leg raise', 'lying leg raise'],
  'Mountain Climbers': ['mountain climbers', 'mountain climber'],
  'Dead Bug': ['dead bug', 'dead bugs'],
  'Bird Dog': ['bird dog', 'bird dogs'],
  
  // Arms
  'Bicep Curls': ['bicep curls', 'bicep curl', 'curls', 'curl', 'bb curl', 'barbell curl'],
  'Dumbbell Curls': ['db curls', 'db curl', 'dumbbell curl', 'dumbbell curls'],
  'Hammer Curls': ['hammer curls', 'hammer curl'],
  'Tricep Pushdown': ['tricep pushdown', 'pushdown', 'pushdowns', 'cable pushdown', 'tricep pushdowns'],
  'Skull Crushers': ['skull crushers', 'skull crusher', 'skullcrushers', 'lying tricep extension'],
  'Tricep Dips': ['tricep dips', 'bench dips'],
  
  // Cardio / Conditioning
  'Burpees': ['burpees', 'burpee'],
  'Jumping Jacks': ['jumping jacks', 'jumping jack', 'jj', 'star jumps'],
  'Box Jumps': ['box jumps', 'box jump'],
  'Jump Rope': ['jump rope', 'skipping', 'rope', 'skip rope'],
  'Running': ['running', 'run', 'jog', 'jogging'],
  'Walking': ['walking', 'walk'],
  'Rowing': ['rowing', 'row machine', 'erg', 'rower'],
  'Cycling': ['cycling', 'bike', 'biking', 'cycle'],
  'Stair Climber': ['stair climber', 'stairs', 'stairmaster'],
  
  // Stretching / Mobility
  'Foam Rolling': ['foam roll', 'foam rolling', 'roller'],
  'Stretching': ['stretch', 'stretching', 'stretches'],
};

// Build reverse lookup map
const buildAliasMap = (): Map<string, string> => {
  const map = new Map<string, string>();
  
  Object.entries(EXERCISE_ALIASES).forEach(([canonical, aliases]) => {
    map.set(canonical.toLowerCase(), canonical);
    aliases.forEach(alias => {
      map.set(alias.toLowerCase(), canonical);
    });
  });
  
  return map;
};

const ALIAS_MAP = buildAliasMap();

// Get all canonical exercise names
export const getAllCanonicalExercises = (): string[] => {
  return Object.keys(EXERCISE_ALIASES).sort();
};

// Backwards compatibility alias
export const getAllExercises = getAllCanonicalExercises;

// Check if exercise exists in dictionary
export const isKnownExercise = (input: string): boolean => {
  return ALIAS_MAP.has(input.trim().toLowerCase());
};

// Normalization result interface
export interface NormalizationResult {
  canonical: string;
  isNew: boolean;
  suggestions: string[];
}

// Normalize an exercise name - returns { canonical, isNew, suggestions }
export const normalizeExerciseName = (input: string): NormalizationResult => {
  const cleaned = input.trim().toLowerCase();
  
  // Direct match in alias map
  if (ALIAS_MAP.has(cleaned)) {
    return {
      canonical: ALIAS_MAP.get(cleaned)!,
      isNew: false,
      suggestions: [],
    };
  }
  
  // Find close matches for "did you mean?"
  const suggestions = findSimilarExercises(cleaned);
  
  // Format as new exercise
  const formatted = formatAsNewExercise(input);
  
  return {
    canonical: formatted,
    isNew: true,
    suggestions,
  };
};

// Simple string normalization (backwards compatibility)
export const normalizeExerciseNameSimple = (input: string): string => {
  const result = normalizeExerciseName(input);
  return result.canonical;
};

// Find similar exercises using Levenshtein-like matching
const findSimilarExercises = (input: string): string[] => {
  const inputNormalized = input.replace(/[-\s]/g, '').toLowerCase();
  const results: Array<{ name: string; score: number }> = [];
  
  const canonicalNames = Object.keys(EXERCISE_ALIASES);
  
  for (const canonical of canonicalNames) {
    const canonicalNormalized = canonical.replace(/[-\s]/g, '').toLowerCase();
    
    // Calculate similarity score
    const score = calculateSimilarity(inputNormalized, canonicalNormalized);
    
    if (score > 0.4) { // 40% similarity threshold
      results.push({ name: canonical, score });
    }
  }
  
  // Also check aliases
  ALIAS_MAP.forEach((canonical, alias) => {
    const aliasNormalized = alias.replace(/[-\s]/g, '');
    const score = calculateSimilarity(inputNormalized, aliasNormalized);
    
    if (score > 0.4 && !results.find(r => r.name === canonical)) {
      results.push({ name: canonical, score });
    }
  });
  
  // Sort by score descending, return top 3
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(r => r.name);
};

// Simple similarity calculation (Dice coefficient)
const calculateSimilarity = (a: string, b: string): number => {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  
  // Create bigrams
  const bigramsA = new Set<string>();
  const bigramsB = new Set<string>();
  
  for (let i = 0; i < a.length - 1; i++) {
    bigramsA.add(a.substring(i, i + 2));
  }
  for (let i = 0; i < b.length - 1; i++) {
    bigramsB.add(b.substring(i, i + 2));
  }
  
  // Count intersection
  let intersection = 0;
  bigramsA.forEach(bigram => {
    if (bigramsB.has(bigram)) intersection++;
  });
  
  return (2 * intersection) / (bigramsA.size + bigramsB.size);
};

// Format unknown exercise nicely
const formatAsNewExercise = (input: string): string => {
  return input
    .trim()
    .split(/[\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Search exercises for autocomplete
export const searchExercises = (query: string, userExercises: string[] = []): string[] => {
  if (!query || query.length < 2) return [];
  
  const q = query.toLowerCase();
  const results: string[] = [];
  const seen = new Set<string>();
  
  // Priority 1: User's recent exercises (prefix match)
  userExercises.forEach(exercise => {
    if (exercise.toLowerCase().startsWith(q) && !seen.has(exercise)) {
      results.push(exercise);
      seen.add(exercise);
    }
  });
  
  // Priority 2: Canonical exercises (prefix match)
  Object.keys(EXERCISE_ALIASES).forEach(canonical => {
    if (canonical.toLowerCase().startsWith(q) && !seen.has(canonical)) {
      results.push(canonical);
      seen.add(canonical);
    }
  });
  
  // Priority 3: User's recent (contains match)
  userExercises.forEach(exercise => {
    if (exercise.toLowerCase().includes(q) && !seen.has(exercise)) {
      results.push(exercise);
      seen.add(exercise);
    }
  });
  
  // Priority 4: Canonical (contains match)
  Object.keys(EXERCISE_ALIASES).forEach(canonical => {
    if (canonical.toLowerCase().includes(q) && !seen.has(canonical)) {
      results.push(canonical);
      seen.add(canonical);
    }
  });
  
  // Priority 5: Alias matches
  ALIAS_MAP.forEach((canonical, alias) => {
    if (alias.includes(q) && !seen.has(canonical)) {
      results.push(canonical);
      seen.add(canonical);
    }
  });
  
  return results.slice(0, 5);
};
