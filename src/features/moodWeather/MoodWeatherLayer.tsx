import { motion } from "framer-motion";
import { useMoodWeather } from "@/hooks/useMoodWeather";
import { Heart, Droplets, Sparkles } from "lucide-react";

export const MoodWeatherLayer = () => {
  const weather = useMoodWeather();

  const gradientStyle = {
    background: `linear-gradient(to bottom, ${weather.gradient.join(", ")})`,
  };

  const colorTempFilter = {
    warm: "sepia(0.15) saturate(1.1)",
    cool: "hue-rotate(-10deg) saturate(0.9)",
    neutral: "none",
  };

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background Gradient */}
      <motion.div
        className="absolute inset-0"
        style={gradientStyle}
        animate={{
          filter: colorTempFilter[weather.colorTemp],
        }}
        transition={{ duration: 1 }}
      />

      {/* Color Overlay */}
      {weather.overlayColor && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: weather.overlayOpacity || 0,
            backgroundColor: weather.overlayColor 
          }}
          transition={{ duration: 0.8 }}
        />
      )}

      {/* Vignette */}
      <motion.div
        className="absolute inset-0"
        animate={{
          boxShadow: `inset 0 0 120px rgba(0, 0, 0, ${weather.vignetteIntensity})`,
        }}
        transition={{ duration: 0.6 }}
      />

      {/* Particles */}
      {weather.particleType !== 'none' && (
        <ParticleSystem 
          type={weather.particleType} 
          count={weather.particleCount}
          color={weather.particleColor}
        />
      )}

      {/* Special Effects */}
      {weather.specialEffect === 'shake' && (
        <motion.div
          className="absolute inset-0"
          animate={{
            x: [0, -2, 2, -2, 2, 0],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: 3,
          }}
        />
      )}

      {weather.specialEffect === 'glow' && (
        <motion.div
          className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-transparent"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {weather.specialEffect === 'pulse' && (
        <motion.div
          className="absolute inset-0"
          animate={{
            scale: [1, 1.02, 1],
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.div>
  );
};

interface ParticleSystemProps {
  type: 'sparkles' | 'hearts' | 'rain' | 'dust' | 'sunbeams';
  count: number;
  color: string;
}

const ParticleSystem = ({ type, count, color }: ParticleSystemProps) => {
  const particles = Array.from({ length: count }, (_, i) => i);

  const getParticleIcon = () => {
    switch (type) {
      case 'hearts':
        return <Heart className="w-3 h-3" fill={color} stroke={color} />;
      case 'rain':
        return <Droplets className="w-2 h-2" stroke={color} />;
      case 'sparkles':
        return <Sparkles className="w-2 h-2" stroke={color} />;
      case 'dust':
        return <div className="w-1 h-1 rounded-full" style={{ backgroundColor: color }} />;
      case 'sunbeams':
        return <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: color }} />;
      default:
        return null;
    }
  };

  const getAnimationProps = () => {
    const baseDelay = Math.random() * 5;
    
    switch (type) {
      case 'hearts':
        return {
          initial: { y: "100vh", opacity: 0, rotate: 0 },
          animate: {
            y: "-20vh",
            opacity: [0, 1, 1, 0],
            rotate: [0, 360],
            x: [0, Math.random() * 40 - 20, Math.random() * 40 - 20],
          },
          transition: {
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            delay: baseDelay,
          },
        };
      case 'rain':
        return {
          initial: { y: "-10vh", opacity: 0 },
          animate: {
            y: "110vh",
            opacity: [0, 0.7, 0.7, 0],
          },
          transition: {
            duration: 2 + Math.random() * 1,
            repeat: Infinity,
            delay: baseDelay,
          },
        };
      case 'sparkles':
        return {
          initial: { scale: 0, opacity: 0 },
          animate: {
            scale: [0, 1, 1, 0],
            opacity: [0, 1, 1, 0],
            y: [0, -20, -40],
          },
          transition: {
            duration: 2 + Math.random() * 1,
            repeat: Infinity,
            delay: baseDelay,
          },
        };
      case 'dust':
        return {
          initial: { y: 0, opacity: 0 },
          animate: {
            y: [0, 30, 60],
            x: [0, Math.random() * 20 - 10, Math.random() * 20 - 10],
            opacity: [0, 0.4, 0],
          },
          transition: {
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            delay: baseDelay,
          },
        };
      case 'sunbeams':
        return {
          initial: { opacity: 0, rotate: -45 },
          animate: {
            opacity: [0, 0.3, 0],
            scale: [0.8, 1, 1.2],
          },
          transition: {
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: baseDelay,
          },
        };
      default:
        return {};
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      {particles.map((i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: type === 'hearts' || type === 'dust' || type === 'sparkles' ? `${Math.random() * 100}%` : 0,
          }}
          {...getAnimationProps()}
        >
          {getParticleIcon()}
        </motion.div>
      ))}
    </div>
  );
};
