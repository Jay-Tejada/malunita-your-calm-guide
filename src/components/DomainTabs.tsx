import { useState } from "react";
import { cn } from "@/lib/utils";
import { Inbox, Home, Briefcase, Dumbbell, FolderKanban, Tag, Heart, DollarSign, ShoppingCart, Baby, Car, Plane, Coffee, Book, Music, Gamepad2, Film, Star, Zap, LucideIcon, Plus, Clock } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { CustomCategory } from "@/hooks/useCustomCategories";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const domains = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "home", label: "Home", icon: Home },
  { id: "work", label: "Work", icon: Briefcase },
  { id: "gym", label: "Gym", icon: Dumbbell },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "someday", label: "Someday", icon: Clock },
];

const ICON_MAP: Record<string, LucideIcon> = {
  "Tag": Tag,
  "Home": Home,
  "Work": Briefcase,
  "Family": Heart,
  "Money": DollarSign,
  "Shopping": ShoppingCart,
  "Kids": Baby,
  "Transport": Car,
  "Travel": Plane,
  "Food": Coffee,
  "Learning": Book,
  "Music": Music,
  "Games": Gamepad2,
  "Entertainment": Film,
  "Important": Star,
  "Urgent": Zap,
  "Clock": Clock,
};

interface DomainTabsProps {
  value: string;
  onChange: (domain: string) => void;
  isDragging?: boolean;
  customCategories?: CustomCategory[];
  onCreateCategory?: (name: string) => void;
}

const CategoryTab = ({ 
  domain, 
  isActive, 
  isDragging, 
  onClick 
}: { 
  domain: typeof domains[0]; 
  isActive: boolean; 
  isDragging: boolean;
  onClick: () => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `category-${domain.id}`,
  });

  const Icon = domain.icon;

  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-normal transition-all duration-300 whitespace-nowrap",
        isActive
          ? "bg-accent text-accent-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
        isDragging && "ring-2 ring-accent/50",
        isOver && "ring-2 ring-accent bg-accent/20 scale-105"
      )}
    >
      <Icon className="w-4 h-4" />
      {domain.label}
    </button>
  );
};

export const DomainTabs = ({ value, onChange, isDragging = false, customCategories = [], onCreateCategory }: DomainTabsProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const { toast } = useToast();

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }
    onCreateCategory?.(newCategoryName.trim());
    setNewCategoryName("");
    setIsDialogOpen(false);
  };

  return (
    <div className={cn(
      "flex gap-2 p-1 bg-card rounded-full border transition-all",
      isDragging ? "border-accent shadow-lg" : "border-secondary"
    )}>
      <div className="flex gap-2 overflow-x-auto items-center">
        {domains.map((domain) => (
          <CategoryTab
            key={domain.id}
            domain={domain}
            isActive={value === domain.id}
            isDragging={isDragging}
            onClick={() => onChange(domain.id)}
          />
        ))}
        {customCategories.map((category) => {
          const IconComponent = ICON_MAP[category.icon || "Tag"] || Tag;
          return (
            <CategoryTab
              key={category.id}
              domain={{ id: `custom-${category.id}`, label: category.name, icon: IconComponent }}
              isActive={value === `custom-${category.id}`}
              isDragging={isDragging}
              onClick={() => onChange(`custom-${category.id}`)}
            />
          );
        })}
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 rounded-full hover:bg-accent"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Category</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <Input
                placeholder="Category name (e.g., 1844, Client Work)"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateCategory();
                  }
                }}
              />
              <Button onClick={handleCreateCategory}>
                Create Category
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
