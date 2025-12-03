import { useEffect, useState } from "react";

interface LivingOrbProps {
  aiThinking?: boolean;
  taskCompleted?: boolean;
  dimmed?: boolean;
}

export default function LivingOrb({ aiThinking = false, taskCompleted = false, dimmed = false }: LivingOrbProps) {
  const [timeGradient, setTimeGradient] = useState("");
  const [breathing, setBreathing] = useState(false);
  const [pulse, setPulse] = useState(false);

  // --- TIME OF DAY GRADIENT LOGIC ---
  const updateOrbGradient = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 11) {
      // Morning — warm, soft highlight
      setTimeGradient(
        "radial-gradient(circle at 30% 30%, #f4e6d5, #e5d3bf 70%, #d3c0ac)"
      );
    } else if (hour >= 11 && hour < 17) {
      // Noon — neutral soft cream
      setTimeGradient(
        "radial-gradient(circle at 50% 50%, #f2eade, #e6dccc 70%, #d8cdbb)"
      );
    } else if (hour >= 17 && hour < 21) {
      // Evening — muted clay tone
      setTimeGradient(
        "radial-gradient(circle at 70% 70%, #ecd9c8, #d3bca9 70%, #c3a997)"
      );
    } else {
      // Night — cool shadow crescent
      setTimeGradient(
        "radial-gradient(circle at 85% 85%, #dcd7d1, #b9c1c9 70%, #a2aab4)"
      );
    }
  };

  useEffect(() => {
    updateOrbGradient();
    const interval = setInterval(updateOrbGradient, 300000); // update every 5 min
    return () => clearInterval(interval);
  }, []);

  // --- BREATHING (Idle state) ---
  useEffect(() => {
    setBreathing(true);
  }, []);

  // --- AI THINKING STATE (Glow animation) ---
  const glowStyle = aiThinking
    ? {
        boxShadow:
          "0 0 22px rgba(220, 200, 180, 0.45), 0 0 45px rgba(210, 190, 170, 0.25)",
        transition: "box-shadow 0.8s ease",
      }
    : {};

  // --- TASK COMPLETION PULSE ---
  useEffect(() => {
    if (taskCompleted) {
      setPulse(true);
      setTimeout(() => setPulse(false), 1200);
    }
  }, [taskCompleted]);

  // --- DIM WHEN START MY DAY IS ACTIVE ---
  const dimStyle = dimmed ? { opacity: 0.18, filter: "blur(2px)" } : {};

  return (
    <div
      style={{
        width: "160px",
        height: "160px",
        borderRadius: "50%",
        background: timeGradient,
        transition: "background 2s ease, opacity 0.8s ease, transform 1.8s ease",
        transform: breathing ? "scale(1.02)" : "scale(1)",
        animation: pulse
          ? "orbPulse 1.2s ease-out"
          : breathing
          ? "orbBreathing 6s ease-in-out infinite"
          : "",
        ...glowStyle,
        ...dimStyle,
      }}
    />
  );
}
