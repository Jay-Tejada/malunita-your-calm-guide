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
        {/* Left: Back arrow only - larger tap target */}
        <button 
          onClick={handleBack} 
          className="text-foreground/30 hover:text-foreground/50 p-3 -ml-3 transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        {/* Center: Page title - absolutely centered */}
        <span className="font-mono text-foreground/80 absolute left-1/2 -translate-x-1/2">
          {title}
        </span>
        
        {/* Right: Empty spacer for alignment */}
        <div className="w-10" />
      </div>
    </header>
  );
};
