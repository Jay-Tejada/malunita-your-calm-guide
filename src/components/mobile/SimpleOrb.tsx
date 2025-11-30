

interface SimpleOrbProps {
  onTap?: () => void;
  isRecording?: boolean;
  isProcessing?: boolean;
}

/**
 * SimpleOrb - Large, thumb-optimized orb button with gradient
 * Clean and minimal - no 3D, just beautiful gradients
 */
export const SimpleOrb = ({ 
  onTap, 
  isRecording = false,
  isProcessing = false
}: SimpleOrbProps) => {
  const getOrbClass = () => {
    if (isRecording) return 'meditation-orb-recording';
    if (isProcessing) return 'meditation-orb-processing';
    return 'meditation-orb';
  };

  return (
    <div 
      className={getOrbClass()}
      onClick={onTap}
    >
    </div>
  );
};
