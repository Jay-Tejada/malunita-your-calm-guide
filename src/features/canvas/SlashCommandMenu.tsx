import { useState, useEffect, useRef } from "react";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  Image,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SlashCommandMenuProps {
  position: { top: number; left: number };
  onSelect: (type: string, level?: number) => void;
  onClose: () => void;
}

const commands = [
  { type: "text", label: "Text", icon: Type, description: "Plain text block" },
  { type: "header", label: "Heading 1", icon: Heading1, level: 1, description: "Large heading" },
  { type: "header", label: "Heading 2", icon: Heading2, level: 2, description: "Medium heading" },
  { type: "header", label: "Heading 3", icon: Heading3, level: 3, description: "Small heading" },
  { type: "checklist", label: "Checklist", icon: CheckSquare, description: "Task with checkbox" },
  { type: "image", label: "Image", icon: Image, description: "Upload an image" },
  { type: "divider", label: "Divider", icon: Minus, description: "Horizontal line" },
];

export function SlashCommandMenu({ position, onSelect, onClose }: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % commands.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + commands.length) % commands.length);
          break;
        case "Enter":
          e.preventDefault();
          const selected = commands[selectedIndex];
          onSelect(selected.type, selected.level);
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, onSelect, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg max-h-[300px] overflow-y-auto w-56"
      style={{ top: position.top, left: position.left }}
    >
      <div className="p-1">
        {commands.map((cmd, index) => (
          <button
            key={`${cmd.type}-${cmd.level || index}`}
            onClick={() => onSelect(cmd.type, cmd.level)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors",
              selectedIndex === index
                ? "bg-accent text-accent-foreground"
                : "hover:bg-muted text-foreground"
            )}
          >
            <cmd.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <div className="font-mono text-sm">{cmd.label}</div>
              <div className="text-xs text-muted-foreground truncate">{cmd.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
