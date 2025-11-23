import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecentEventTitles, RecentEventTitle } from "@/hooks/useRecentEventTitles";

interface EventTitleAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const EventTitleAutocomplete = ({
  value,
  onChange,
  placeholder = "Event title",
  className,
}: EventTitleAutocompleteProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<RecentEventTitle[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { getSuggestions } = useRecentEventTitles();

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value.trim()) {
        const results = getSuggestions(value);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [value, getSuggestions]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (title: string) => {
    onChange(title);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelectSuggestion(suggestions[highlightedIndex].title);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden animate-fade-in">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => handleSelectSuggestion(suggestion.title)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                "w-full px-3 py-2 text-left flex items-center gap-2",
                "hover:bg-accent transition-colors duration-100",
                "font-mono text-sm",
                highlightedIndex === index && "bg-accent"
              )}
            >
              {suggestion.usage_count >= 3 && (
                <Star className="w-3 h-3 text-primary fill-primary flex-shrink-0" />
              )}
              <span className="truncate">{suggestion.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
