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
    <header className="fixed top-0 left-0 right-0 h-14 bg-background z-10">
      <div className="flex items-center justify-between px-4 h-14 border-b border-foreground/5">
        {/* Left - Back arrow ONLY */}
        <button 
          onClick={handleBack} 
          className="p-2 -ml-2 text-foreground/30 hover:text-foreground/50"
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        {/* Center - Title */}
        <span className="absolute left-1/2 -translate-x-1/2 font-mono text-foreground/80">
          {title}
        </span>
        
        {/* Right - Empty spacer */}
        <div className="w-9" />
      </div>
    </header>
  );
};
