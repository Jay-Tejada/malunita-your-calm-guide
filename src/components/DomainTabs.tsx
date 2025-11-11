import { useState } from "react";
import { cn } from "@/lib/utils";
import { Inbox, Home, Briefcase, Dumbbell, FolderKanban, Tag } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { CustomCategory } from "@/hooks/useCustomCategories";

const domains = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "home", label: "Home", icon: Home },
  { id: "work", label: "Work", icon: Briefcase },
  { id: "gym", label: "Gym", icon: Dumbbell },
  { id: "projects", label: "Projects", icon: FolderKanban },
];

interface DomainTabsProps {
  value: string;
  onChange: (domain: string) => void;
  isDragging?: boolean;
  customCategories?: CustomCategory[];
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

export const DomainTabs = ({ value, onChange, isDragging = false, customCategories = [] }: DomainTabsProps) => {
  return (
    <div className={cn(
      "flex gap-2 p-1 bg-card rounded-full border transition-all",
      isDragging ? "border-accent shadow-lg" : "border-secondary"
    )}>
      <div className="flex gap-2 overflow-x-auto">
        {domains.map((domain) => (
          <CategoryTab
            key={domain.id}
            domain={domain}
            isActive={value === domain.id}
            isDragging={isDragging}
            onClick={() => onChange(domain.id)}
          />
        ))}
        {customCategories.map((category) => (
          <CategoryTab
            key={category.id}
            domain={{ id: `custom-${category.id}`, label: category.name, icon: Tag }}
            isActive={value === `custom-${category.id}`}
            isDragging={isDragging}
            onClick={() => onChange(`custom-${category.id}`)}
          />
        ))}
      </div>
    </div>
  );
};
