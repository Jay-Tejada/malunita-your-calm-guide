import { motion } from 'framer-motion';

interface MiniOrbProps {
  onClick?: () => void;
}

export const MiniOrb = ({ onClick }: MiniOrbProps) => {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-10 h-10 rounded-full opacity-60 hover:opacity-80 transition-opacity z-40"
      style={{
        background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9) 0%, rgba(245,240,235,0.8) 30%, rgba(230,225,220,0.7) 60%, rgba(200,195,190,0.6) 100%)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08), inset 0 2px 10px rgba(255,255,255,0.6)',
      }}
      animate={{
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      aria-label="AI companion"
    />
  );
};
