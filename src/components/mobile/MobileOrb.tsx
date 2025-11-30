import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Canvas } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';

interface MobileOrbProps {
  onTap?: () => void;
  onLongPress?: () => void;
  isRecording?: boolean;
  isProcessing?: boolean;
  className?: string;
}

/**
 * MobileOrb - Large, thumb-optimized orb button for mobile
 * 
 * Features:
 * - Tap: Opens input (voice or text)
 * - Long press: Direct voice mode
 * - Breathing animation
 * - 100px diameter for easy thumb reach
 */
export const MobileOrb = ({ 
  onTap, 
  onLongPress,
  isRecording = false,
  isProcessing = false,
  className 
}: MobileOrbProps) => {
  let pressTimer: NodeJS.Timeout;

  const handleTouchStart = () => {
    pressTimer = setTimeout(() => {
      onLongPress?.();
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = () => {
    clearTimeout(pressTimer);
  };

  const handleClick = () => {
    clearTimeout(pressTimer);
    onTap?.();
  };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {/* The Orb */}
      <motion.button
        className="relative w-[100px] h-[100px] rounded-full focus:outline-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        animate={{ scale: isRecording ? 1.1 : 1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {/* 3D Rotating Sphere */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <Canvas camera={{ position: [0, 0, 2.5], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <Sphere args={[1, 64, 64]}>
              <MeshDistortMaterial
                color={isRecording ? '#a78bfa' : isProcessing ? '#60a5fa' : '#fbbf24'}
                attach="material"
                distort={0.3}
                speed={isRecording ? 2 : isProcessing ? 3 : 1}
                roughness={0.4}
                metalness={0.1}
                transparent
                opacity={0.6}
              />
            </Sphere>
          </Canvas>
        </div>

        {/* Glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)',
            boxShadow: '0 0 40px rgba(251, 191, 36, 0.2)',
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Voice icon (shows when not recording) */}
        {!isRecording && !isProcessing && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Mic className="w-8 h-8 text-white drop-shadow-lg" />
          </motion.div>
        )}

        {/* Recording indicator */}
        {isRecording && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <div className="w-4 h-4 rounded-full bg-red-500" />
          </motion.div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        )}
      </motion.button>

      {/* Label */}
      <p className="text-sm text-foreground/60 font-light">
        What's on your mind?
      </p>
    </div>
  );
};
