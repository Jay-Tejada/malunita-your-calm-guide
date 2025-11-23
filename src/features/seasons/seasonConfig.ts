import { format, isAfter, isBefore, isEqual } from 'date-fns';

export type SeasonType = 'winter' | 'spring' | 'summer' | 'starfall' | 'none';

export interface SeasonConfig {
  type: SeasonType;
  name: string;
  description: string;
  effects: {
    particles?: 'snow' | 'flowers' | 'stars' | 'heatshimmer';
    lightingAdjustment?: number; // -1 to 1, affects brightness
    joyMultiplier?: number; // multiplies joy gains
    xpMultiplier?: number; // multiplies XP gains
    helperMessage?: string;
    ambientColor?: string; // HSL color overlay
  };
  startDate: { month: number; day: number }; // 1-indexed month
  endDate: { month: number; day: number };
}

const SEASON_CONFIGS: Record<Exclude<SeasonType, 'none' | 'starfall'>, SeasonConfig> = {
  winter: {
    type: 'winter',
    name: 'Winter Festival',
    description: 'A cozy time to reflect and complete unfinished tasks',
    effects: {
      particles: 'snow',
      lightingAdjustment: -0.1,
      helperMessage: 'Want to wrap up loose ends before the year ends?',
      ambientColor: 'hsl(200, 30%, 95%)',
    },
    startDate: { month: 12, day: 1 },
    endDate: { month: 1, day: 7 },
  },
  spring: {
    type: 'spring',
    name: 'Spring Bloom',
    description: 'Fresh beginnings bring renewed energy',
    effects: {
      particles: 'flowers',
      lightingAdjustment: 0.1,
      joyMultiplier: 1.2,
      ambientColor: 'hsl(140, 40%, 95%)',
    },
    startDate: { month: 3, day: 15 },
    endDate: { month: 4, day: 30 },
  },
  summer: {
    type: 'summer',
    name: 'Summer Glow',
    description: 'Warm days perfect for focused work',
    effects: {
      particles: 'heatshimmer',
      lightingAdjustment: 0.15,
      xpMultiplier: 1.25,
      ambientColor: 'hsl(45, 60%, 95%)',
    },
    startDate: { month: 6, day: 15 },
    endDate: { month: 8, day: 31 },
  },
};

// Generate a deterministic "random" starfall night for each month
// Uses month + year as seed to ensure same night each month
function getStarfallNightForMonth(year: number, month: number): number {
  const seed = year * 12 + month;
  // Use simple hash to generate day between 15-28 (avoid month edges)
  const hash = ((seed * 2654435761) % 2147483647) >>> 0;
  return 15 + (hash % 14); // Day 15-28
}

function isDateInRange(
  date: Date,
  startMonth: number,
  startDay: number,
  endMonth: number,
  endDay: number
): boolean {
  const year = date.getFullYear();
  
  // Handle year-wrapping seasons (like winter Dec-Jan)
  if (startMonth > endMonth) {
    const startDate = new Date(year, startMonth - 1, startDay);
    const endDate = new Date(year + 1, endMonth - 1, endDay);
    return (isAfter(date, startDate) || isEqual(date, startDate)) || 
           (isBefore(date, endDate) || isEqual(date, endDate));
  }
  
  const startDate = new Date(year, startMonth - 1, startDay);
  const endDate = new Date(year, endMonth - 1, endDay);
  
  return (isAfter(date, startDate) || isEqual(date, startDate)) && 
         (isBefore(date, endDate) || isEqual(date, endDate));
}

export function getCurrentSeason(date: Date = new Date()): SeasonConfig | null {
  // Check for Starfall Night first (highest priority)
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-indexed
  const day = date.getDate();
  const starfallDay = getStarfallNightForMonth(year, month);
  
  if (day === starfallDay) {
    return {
      type: 'starfall',
      name: 'Starfall Night',
      description: 'A rare celestial event - complete tasks under falling stars for special rewards',
      effects: {
        particles: 'stars',
        lightingAdjustment: -0.2,
        helperMessage: '✨ Starfall Night is here! Complete tasks for a chance at rare cosmetics!',
        ambientColor: 'hsl(250, 40%, 20%)',
      },
      startDate: { month, day: starfallDay },
      endDate: { month, day: starfallDay },
    };
  }
  
  // Check regular seasons
  for (const season of Object.values(SEASON_CONFIGS)) {
    if (isDateInRange(date, season.startDate.month, season.startDate.day, season.endDate.month, season.endDate.day)) {
      return season;
    }
  }
  
  return null;
}

export function isSeasonActive(seasonType: SeasonType, date: Date = new Date()): boolean {
  const currentSeason = getCurrentSeason(date);
  return currentSeason?.type === seasonType;
}

export function getNextSeasonStartDate(): Date {
  const now = new Date();
  const year = now.getFullYear();
  
  const seasonDates = Object.values(SEASON_CONFIGS).map(season => {
    const startMonth = season.startDate.month;
    const startDay = season.startDate.day;
    const seasonYear = startMonth < now.getMonth() + 1 ? year + 1 : year;
    return new Date(seasonYear, startMonth - 1, startDay);
  });
  
  // Find the next upcoming season
  const futureDates = seasonDates.filter(d => isAfter(d, now));
  if (futureDates.length === 0) {
    // If no future dates this year, return first season of next year
    return seasonDates[0];
  }
  
  return futureDates.reduce((earliest, current) => 
    isBefore(current, earliest) ? current : earliest
  );
}
