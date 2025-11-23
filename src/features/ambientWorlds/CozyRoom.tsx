import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export const CozyRoom = () => {
  const [flickerIntensity, setFlickerIntensity] = useState(1);

  useEffect(() => {
    const flickerInterval = setInterval(() => {
      const newIntensity = 0.9 + Math.random() * 0.1;
      setFlickerIntensity(newIntensity);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(flickerInterval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, hsl(30, 50%, 85%), hsl(25, 45%, 75%), hsl(20, 40%, 68%))',
        }}
      />

      {/* Desk shadow */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1/3"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.15), transparent)',
        }}
      />

      {/* Lamp glow */}
      <motion.div
        className="absolute top-12 right-16 w-64 h-64 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255, 220, 150, 0.4), transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{
          opacity: flickerIntensity,
        }}
        transition={{ duration: 0.5 }}
      />

      {/* Book silhouettes */}
      <div className="absolute bottom-16 left-8 w-16 h-24 bg-primary/20 rounded-sm" />
      <div className="absolute bottom-16 left-28 w-20 h-32 bg-primary/15 rounded-sm" />
      <div className="absolute bottom-16 left-52 w-14 h-28 bg-primary/25 rounded-sm" />

      {/* Window light shaft */}
      <motion.div
        className="absolute top-0 right-0 w-96 h-full"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 240, 200, 0.2), transparent 60%)',
        }}
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating dust particles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, -60],
            x: [0, Math.random() * 20 - 10],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};
