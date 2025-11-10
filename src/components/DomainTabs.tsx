import { useState } from "react";
import { cn } from "@/lib/utils";
import { Home, Briefcase, Dumbbell, FolderKanban } from "lucide-react";

const domains = [
  { id: "home", label: "Home", icon: Home },
  { id: "work", label: "Work", icon: Briefcase },
  { id: "gym", label: "Gym", icon: Dumbbell },
  { id: "projects", label: "Projects", icon: FolderKanban },
];

interface DomainTabsProps {
  value: string;
  onChange: (domain: string) => void;
}

export const DomainTabs = ({ value, onChange }: DomainTabsProps) => {
  return (
    <div className="flex gap-2 p-1 bg-card rounded-full border border-secondary overflow-x-auto">
      {domains.map((domain) => {
        const Icon = domain.icon;
        const isActive = value === domain.id;
        return (
          <button
            key={domain.id}
            onClick={() => onChange(domain.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-normal transition-all duration-300 whitespace-nowrap",
              isActive
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <Icon className="w-4 h-4" />
            {domain.label}
          </button>
        );
      })}
    </div>
  );
};
