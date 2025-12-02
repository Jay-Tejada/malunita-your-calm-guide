import { useCompanionMessage, CompanionMessage as CompanionMessageType } from '@/hooks/useCompanionMessage';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlowSession } from '@/utils/taskCategorizer';

interface CompanionMessageProps {
  onStartSession?: (session: FlowSession) => void;
}

const CompanionMessage = ({ onStartSession }: CompanionMessageProps) => {
  const message = useCompanionMessage();
  const [isVisible, setIsVisible] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const navigate = useNavigate();
  
  // Fade in on mount and when message changes
  useEffect(() => {
    setIsVisible(false);
    setShowDetail(false);
    
    const timer = setTimeout(() => {
      setDisplayedText(message?.text || '');
      setIsVisible(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [message?.text]);

  if (!message) return null;

  // Define actions based on message type
  const getAction = () => {
    switch (message.type) {
      case 'nudge':
        return {
          label: 'Go to Inbox',
          action: () => navigate('/inbox')
        };
      case 'insight':
        return {
          label: 'View Today',
          action: () => navigate('/today')
        };
      case 'celebration':
        return {
          label: 'See Progress',
          action: () => setShowDetail(!showDetail)
        };
      default:
        return null;
    }
  };
  
  const actionConfig = getAction();

  return (
    <div 
      className={`
        text-center transition-opacity duration-500
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <p 
        onClick={() => actionConfig && setShowDetail(!showDetail)}
        className={`
          text-xs font-mono text-muted-foreground/40 tracking-wide
          ${actionConfig ? 'cursor-pointer hover:text-muted-foreground/60' : ''}
          transition-colors duration-200
        `}
      >
        {displayedText}
      </p>
      
      {/* Expandable action */}
      {showDetail && actionConfig && (
        <button
          onClick={actionConfig.action}
          className="mt-2 text-[10px] text-foreground/30 hover:text-foreground/50 underline transition-colors"
        >
          {actionConfig.label}
        </button>
      )}
      
      {/* Flow session action */}
      {message?.action?.type === 'start_session' && onStartSession && (
        <button
          onClick={() => onStartSession(message.action!.session)}
          className="mt-2 text-xs text-foreground/40 hover:text-foreground/60 underline underline-offset-2"
        >
          Start session →
        </button>
      )}
    </div>
  );
};

export default CompanionMessage;
