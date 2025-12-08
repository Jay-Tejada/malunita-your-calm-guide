// src/ui/tokens.ts

export const colors = {
  bg: {
    base: "#050509",
    elevated: "#0B0B11",
    surface: "#11111A",
  },
  text: {
    primary: "#FFFFFF",
    secondary: "#A3A3B5",
    muted: "#5C5C70",
    accent: "#D6C6FF",
  },
  accent: {
    primary: "#A78BFA",
    secondary: "#38BDF8",
    destructive: "#F97373",
  },
  border: {
    subtle: "#1E1E28",
    strong: "#2F2F3A",
  },
  orb: {
    dawn: { from: "#F97373", to: "#FBBF24" },
    day: { from: "#38BDF8", to: "#22C55E" },
    dusk: { from: "#A855F7", to: "#F97373" },
    night: { from: "#312E81", to: "#0EA5E9" },
  },
};

export const typography = {
  fontFamily: `"IBM Plex Mono", monospace`,
  displayXL: { size: "2.25rem", lineHeight: "2.75rem", weight: 600 },
  titleL: { size: "1.5rem", lineHeight: "2rem", weight: 500 },
  titleM: { size: "1.25rem", lineHeight: "1.75rem", weight: 500 },
  bodyM: { size: "1rem", lineHeight: "1.5rem", weight: 400 },
  bodyS: { size: "0.875rem", lineHeight: "1.25rem", weight: 400 },
  labelS: { size: "0.75rem", lineHeight: "1rem", weight: 500 },
};

export const layout = {
  radius: { sm: "0.5rem", md: "1rem", lg: "1.5rem", pill: "999px" },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, "2xl": 32, "3xl": 40 },
  pagePaddingX: 20,
};

export type TimeOfDay = "dawn" | "day" | "dusk" | "night";
export type OrbState = "resting" | "listening" | "loading" | "success" | "error";

export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 9) return "dawn";
  if (hour >= 9 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "dusk";
  return "night";
}

export function getOrbGradient(time: TimeOfDay) {
  return colors.orb[time];
}
