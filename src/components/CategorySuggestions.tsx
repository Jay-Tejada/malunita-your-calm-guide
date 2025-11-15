import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategorySuggestion {
  category_id: string;
  category_name: string;
  confidence: number;
  reason: string;
}

interface CategorySuggestionsProps {
  suggestions: CategorySuggestion[];
  onSelectSuggestion: (categoryId: string) => void;
  className?: string;
}

export const CategorySuggestions = ({ 
  suggestions, 
  onSelectSuggestion,
  className 
}: CategorySuggestionsProps) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="w-4 h-4" />
        <span>Smart suggestions</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion.category_id}
            variant="outline"
            size="sm"
            onClick={() => onSelectSuggestion(suggestion.category_id)}
            className="group hover:bg-accent hover:border-accent-foreground/20"
          >
            <span>{suggestion.category_name}</span>
            <Badge 
              variant="secondary" 
              className="ml-2 group-hover:bg-accent-foreground/10"
            >
              {Math.round(suggestion.confidence * 100)}%
            </Badge>
          </Button>
        ))}
      </div>
    </div>
  );
};
