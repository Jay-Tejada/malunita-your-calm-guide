import { motion } from "framer-motion";
import { Heart } from "lucide-react";

export const PastelMeadow = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, hsl(340, 60%, 92%), hsl(320, 55%, 88%), hsl(300, 50%, 85%))',
        }}
      />

      {/* Soft cloud overlay */}
      <motion.div
        className="absolute top-0 left-0 w-full h-1/2"
        style={{
          background: 'radial-gradient(ellipse at 50% 20%, rgba(255, 255, 255, 0.3), transparent 70%)',
        }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Flower clusters */}
      {Array.from({ length: 12 }).map((_, i) => {
        const size = 8 + Math.random() * 16;
        const colors = ['hsl(340, 70%, 75%)', 'hsl(320, 65%, 80%)', 'hsl(280, 60%, 82%)', 'hsl(300, 55%, 85%)'];
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `${Math.random() * 40}%`,
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: colors[Math.floor(Math.random() * colors.length)],
              opacity: 0.6,
            }}
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* Floating petals */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: ["0vh", "100vh"],
            x: [0, Math.random() * 50 - 25, Math.random() * 50 - 25],
            rotate: [0, 360],
            opacity: [0, 0.8, 0.8, 0],
          }}
          transition={{
            duration: 12 + Math.random() * 8,
            repeat: Infinity,
            delay: Math.random() * 10,
            ease: "linear",
          }}
        >
          <Heart 
            className="w-4 h-4" 
            fill={i % 3 === 0 ? 'hsl(340, 70%, 75%)' : i % 3 === 1 ? 'hsl(320, 65%, 80%)' : 'hsl(300, 60%, 85%)'}
            stroke="none"
          />
        </motion.div>
      ))}

      {/* Soft grass base */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1/4"
        style={{
          background: 'linear-gradient(to top, hsl(120, 40%, 80%), transparent)',
          opacity: 0.3,
        }}
      />

      {/* Dreamy bokeh effect */}
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${40 + Math.random() * 80}px`,
            height: `${40 + Math.random() * 80}px`,
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent 60%)',
            filter: 'blur(20px)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 5 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};
