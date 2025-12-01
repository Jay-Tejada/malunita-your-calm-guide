import { ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SimpleHeaderProps {
  title: string;
  onBack?: () => void;
}

export const SimpleHeader = ({ title, onBack }: SimpleHeaderProps) => {
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
        className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      
      <h1 className="text-sm font-mono text-foreground/80">{title}</h1>
      
      <div className="text-muted-foreground/30">
        <Sparkles className="w-5 h-5" />
      </div>
    </header>
  );
};
