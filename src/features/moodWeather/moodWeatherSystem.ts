import { Mood } from "@/state/moodMachine";

export interface WeatherState {
  id: string;
  gradient: string[];
  particleType: 'sparkles' | 'hearts' | 'rain' | 'dust' | 'sunbeams' | 'none';
  particleCount: number;
  particleColor: string;
  vignetteIntensity: number;
  colorTemp: 'warm' | 'cool' | 'neutral';
  specialEffect?: 'shake' | 'glow' | 'pulse';
  overlayColor?: string;
  overlayOpacity?: number;
}

export const moodToWeather: Record<Mood, WeatherState> = {
  happy: {
    id: 'happy',
    gradient: ['hsl(45, 100%, 95%)', 'hsl(35, 95%, 85%)', 'hsl(30, 90%, 75%)'],
    particleType: 'sunbeams',
    particleCount: 12,
    particleColor: 'hsl(45, 100%, 70%)',
    vignetteIntensity: 0.1,
    colorTemp: 'warm',
    overlayColor: 'hsl(45, 80%, 80%)',
    overlayOpacity: 0.15,
  },
  excited: {
    id: 'excited',
    gradient: ['hsl(280, 90%, 95%)', 'hsl(240, 85%, 88%)', 'hsl(200, 80%, 85%)'],
    particleType: 'sparkles',
    particleCount: 35,
    particleColor: 'hsl(280, 100%, 70%)',
    vignetteIntensity: 0.05,
    colorTemp: 'warm',
    specialEffect: 'pulse',
  },
  overjoyed: {
    id: 'overjoyed',
    gradient: ['hsl(320, 95%, 92%)', 'hsl(280, 90%, 85%)', 'hsl(240, 85%, 80%)'],
    particleType: 'sparkles',
    particleCount: 50,
    particleColor: 'hsl(320, 100%, 65%)',
    vignetteIntensity: 0.05,
    colorTemp: 'warm',
    specialEffect: 'glow',
  },
  welcoming: {
    id: 'welcoming',
    gradient: ['hsl(50, 100%, 95%)', 'hsl(40, 95%, 88%)', 'hsl(30, 90%, 82%)'],
    particleType: 'sunbeams',
    particleCount: 15,
    particleColor: 'hsl(50, 100%, 75%)',
    vignetteIntensity: 0.12,
    colorTemp: 'warm',
  },
  loving: {
    id: 'loving',
    gradient: ['hsl(340, 85%, 95%)', 'hsl(320, 80%, 88%)', 'hsl(300, 75%, 85%)'],
    particleType: 'hearts',
    particleCount: 20,
    particleColor: 'hsl(340, 90%, 70%)',
    vignetteIntensity: 0.15,
    colorTemp: 'warm',
    overlayColor: 'hsl(340, 70%, 85%)',
    overlayOpacity: 0.2,
  },
  winking: {
    id: 'winking',
    gradient: ['hsl(45, 95%, 92%)', 'hsl(35, 90%, 85%)', 'hsl(25, 85%, 78%)'],
    particleType: 'sparkles',
    particleCount: 18,
    particleColor: 'hsl(45, 100%, 70%)',
    vignetteIntensity: 0.1,
    colorTemp: 'warm',
  },
  surprised: {
    id: 'surprised',
    gradient: ['hsl(190, 85%, 92%)', 'hsl(200, 80%, 85%)', 'hsl(210, 75%, 80%)'],
    particleType: 'sparkles',
    particleCount: 25,
    particleColor: 'hsl(190, 90%, 70%)',
    vignetteIntensity: 0.08,
    colorTemp: 'cool',
  },
  surprised2: {
    id: 'surprised2',
    gradient: ['hsl(180, 90%, 90%)', 'hsl(190, 85%, 83%)', 'hsl(200, 80%, 78%)'],
    particleType: 'sparkles',
    particleCount: 30,
    particleColor: 'hsl(180, 95%, 65%)',
    vignetteIntensity: 0.1,
    colorTemp: 'cool',
  },
  concerned: {
    id: 'concerned',
    gradient: ['hsl(220, 30%, 85%)', 'hsl(215, 25%, 78%)', 'hsl(210, 20%, 72%)'],
    particleType: 'dust',
    particleCount: 15,
    particleColor: 'hsl(220, 25%, 65%)',
    vignetteIntensity: 0.25,
    colorTemp: 'cool',
    overlayColor: 'hsl(220, 20%, 70%)',
    overlayOpacity: 0.15,
  },
  worried: {
    id: 'worried',
    gradient: ['hsl(210, 35%, 82%)', 'hsl(205, 30%, 75%)', 'hsl(200, 25%, 68%)'],
    particleType: 'rain',
    particleCount: 20,
    particleColor: 'hsl(210, 40%, 60%)',
    vignetteIntensity: 0.3,
    colorTemp: 'cool',
  },
  sad: {
    id: 'sad',
    gradient: ['hsl(220, 25%, 80%)', 'hsl(215, 20%, 70%)', 'hsl(210, 15%, 62%)'],
    particleType: 'rain',
    particleCount: 25,
    particleColor: 'hsl(220, 30%, 55%)',
    vignetteIntensity: 0.35,
    colorTemp: 'cool',
    overlayColor: 'hsl(220, 20%, 65%)',
    overlayOpacity: 0.2,
  },
  sleepy: {
    id: 'sleepy',
    gradient: ['hsl(240, 35%, 75%)', 'hsl(235, 30%, 65%)', 'hsl(230, 25%, 58%)'],
    particleType: 'dust',
    particleCount: 12,
    particleColor: 'hsl(240, 30%, 60%)',
    vignetteIntensity: 0.4,
    colorTemp: 'cool',
    overlayColor: 'hsl(240, 25%, 60%)',
    overlayOpacity: 0.25,
  },
  sleeping: {
    id: 'sleeping',
    gradient: ['hsl(250, 40%, 70%)', 'hsl(245, 35%, 58%)', 'hsl(240, 30%, 50%)'],
    particleType: 'dust',
    particleCount: 8,
    particleColor: 'hsl(250, 35%, 55%)',
    vignetteIntensity: 0.5,
    colorTemp: 'cool',
    overlayColor: 'hsl(245, 30%, 55%)',
    overlayOpacity: 0.35,
  },
  angry: {
    id: 'angry',
    gradient: ['hsl(0, 75%, 88%)', 'hsl(5, 70%, 78%)', 'hsl(10, 65%, 70%)'],
    particleType: 'sparkles',
    particleCount: 30,
    particleColor: 'hsl(0, 85%, 60%)',
    vignetteIntensity: 0.2,
    colorTemp: 'warm',
    specialEffect: 'shake',
    overlayColor: 'hsl(0, 60%, 70%)',
    overlayOpacity: 0.25,
  },
  neutral: {
    id: 'neutral',
    gradient: ['hsl(40, 25%, 95%)', 'hsl(38, 20%, 88%)', 'hsl(35, 18%, 82%)'],
    particleType: 'none',
    particleCount: 0,
    particleColor: 'transparent',
    vignetteIntensity: 0.08,
    colorTemp: 'neutral',
  },
};

export const getWeatherForMood = (mood: Mood): WeatherState => {
  return moodToWeather[mood];
};
