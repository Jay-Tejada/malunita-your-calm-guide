import { useCompanionMessage } from '@/hooks/useCompanionMessage';
import { useState, useEffect } from 'react';

const CompanionMessage = () => {
  const message = useCompanionMessage();
  const [isVisible, setIsVisible] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  
  // Fade in on mount and when message changes
  useEffect(() => {
    setIsVisible(false);
    
    const timer = setTimeout(() => {
      setDisplayedText(message?.text || '');
      setIsVisible(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [message?.text]);

  if (!message) return null;

  return (
    <div 
      className={`
        text-center transition-opacity duration-500
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <p className="text-xs font-mono text-muted-foreground/40 tracking-wide">
        {displayedText}
      </p>
    </div>
  );
};

export default CompanionMessage;
