import { ChevronLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
}

export const PageHeader = ({ title, onBack }: PageHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-background border-b border-foreground/5 z-10">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left: Back arrow */}
        <button
          onClick={handleBack}
          className="text-foreground/30 hover:text-foreground/50 transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Center: Title */}
        <h1 className="text-base font-mono font-medium text-foreground/80">
          {title}
        </h1>

        {/* Right: Companion icon */}
        <button
          className="text-foreground/30"
          aria-label="Open companion"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
