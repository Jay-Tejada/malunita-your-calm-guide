import { ChevronLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SimpleHeaderProps {
  title: string;
  onBack?: () => void;
  onCompanionClick?: () => void;
}

export const SimpleHeader = ({ title, onBack, onCompanionClick }: SimpleHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/");
    }
  };

  return (
    <header className="flex items-center justify-between py-4 mb-6 border-b border-border/20">
      <button
        onClick={handleBack}
        className="text-foreground/30 hover:text-foreground/50 p-2 -ml-2 transition-colors"
        aria-label="Go back"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <span className="font-mono text-foreground/80">{title}</span>
      
      <button
        onClick={onCompanionClick}
        className="text-foreground/30 hover:text-foreground/50 p-2 -mr-2 transition-colors"
        aria-label="Open companion"
      >
        <Sparkles className="w-5 h-5" />
      </button>
    </header>
  );
};
