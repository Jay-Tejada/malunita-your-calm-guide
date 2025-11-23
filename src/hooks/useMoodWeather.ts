import { useEffect, useState } from "react";
import { useMoodStore } from "@/state/moodMachine";
import { useEmotionalMemory } from "@/state/emotionalMemory";
import { getWeatherForMood, WeatherState, moodToWeather } from "@/features/moodWeather/moodWeatherSystem";

export const useMoodWeather = () => {
  const { mood } = useMoodStore();
  const { stress, joy, fatigue } = useEmotionalMemory();
  const [currentWeather, setCurrentWeather] = useState<WeatherState>(getWeatherForMood(mood));

  useEffect(() => {
    // Base weather from mood
    let weather = getWeatherForMood(mood);

    // Adjust based on emotional memory
    // High stress + neutral mood → shift to concerned
    if (mood === "neutral" && stress > 70) {
      weather = moodToWeather.concerned;
    }

    // High joy + neutral mood → shift to happy
    if (mood === "neutral" && joy > 70) {
      weather = moodToWeather.happy;
    }

    // High fatigue → dim the weather slightly
    if (fatigue > 70) {
      weather = {
        ...weather,
        vignetteIntensity: Math.min(0.6, weather.vignetteIntensity + 0.15),
        particleCount: Math.max(0, weather.particleCount - 5),
      };
    }

    // Time of day adjustment
    const hour = new Date().getHours();
    if (hour >= 20 || hour < 6) {
      // Night time - cooler tones
      weather = {
        ...weather,
        colorTemp: 'cool',
        vignetteIntensity: Math.min(0.7, weather.vignetteIntensity + 0.1),
      };
    }

    setCurrentWeather(weather);
  }, [mood, stress, joy, fatigue]);

  return currentWeather;
};
