import { useState } from "react";
import { Plus, Type, Heading, CheckSquare, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HoverAddButtonProps {
  onAddBlock: (type: string) => void;
}

const blockTypes = [
  { type: "text", label: "Text", icon: Type },
  { type: "header", label: "Heading", icon: Heading },
  { type: "checklist", label: "Checklist", icon: CheckSquare },
  { type: "image", label: "Image", icon: Image },
];

export function HoverAddButton({ onAddBlock }: HoverAddButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="group flex items-center justify-center h-4 -my-1">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          className="w-40 bg-popover border border-border rounded-lg shadow-lg z-50"
        >
          {blockTypes.map((block) => (
            <DropdownMenuItem
              key={block.type}
              onClick={() => {
                onAddBlock(block.type);
                setIsOpen(false);
              }}
              className="flex items-center gap-2 cursor-pointer font-mono text-sm"
            >
              <block.icon className="h-4 w-4" />
              {block.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
