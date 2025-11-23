import { motion } from "framer-motion";

export const MinimalistStudio = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, hsl(0, 0%, 97%), hsl(0, 0%, 92%))',
        }}
      />

      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Soft shadow areas */}
      <motion.div
        className="absolute top-0 left-0 w-1/3 h-full"
        style={{
          background: 'linear-gradient(to right, rgba(0,0,0,0.03), transparent)',
        }}
        animate={{
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-0 right-0 w-1/2 h-1/2"
        style={{
          background: 'radial-gradient(ellipse at bottom right, rgba(0,0,0,0.04), transparent 70%)',
        }}
        animate={{
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          delay: 2,
          ease: "easeInOut",
        }}
      />

      {/* Geometric accent lines */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-32 h-px bg-foreground/5"
        animate={{
          scaleX: [0.8, 1, 0.8],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-1/3 right-1/3 w-px h-32 bg-foreground/5"
        animate={{
          scaleY: [0.8, 1, 0.8],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          delay: 1,
          ease: "easeInOut",
        }}
      />

      {/* Soft floating circles */}
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-foreground/5"
          style={{
            left: `${30 + i * 20}%`,
            top: `${20 + i * 25}%`,
            width: `${80 + i * 40}px`,
            height: `${80 + i * 40}px`,
          }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            delay: i,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Light beam from top */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-full"
        style={{
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent 50%)',
        }}
        animate={{
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};
