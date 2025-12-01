import { ChevronLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  onCompanionClick?: () => void;
}

export const PageHeader = ({ title, onBack, onCompanionClick }: PageHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-background border-b border-foreground/5 z-10">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left: Back arrow only */}
        <button 
          onClick={handleBack} 
          className="text-foreground/30 hover:text-foreground/50 p-2 -ml-2 transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        {/* Center: Page title */}
        <span className="font-mono text-foreground/80">{title}</span>
        
        {/* Right: Companion icon */}
        <button 
          onClick={onCompanionClick}
          className="text-foreground/30 hover:text-foreground/50 p-2 -mr-2 transition-colors"
          aria-label="Open companion"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
