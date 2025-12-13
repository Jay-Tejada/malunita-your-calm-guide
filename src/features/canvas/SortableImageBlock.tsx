import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableImageBlockProps {
  id: string;
  children: React.ReactNode;
}

export function SortableImageBlock({ id, children }: SortableImageBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group/sortable",
        isDragging && "z-50 opacity-90"
      )}
    >
      {/* Drag handle - appears on hover */}
      <button
        {...attributes}
        {...listeners}
        className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover/sortable:opacity-100 transition-opacity duration-150 p-1 bg-black/60 backdrop-blur-sm rounded-md text-white/70 hover:text-white cursor-grab active:cursor-grabbing"
        title="Drag to reorder"
      >
        <GripVertical className="w-3 h-3" />
      </button>
      {children}
    </div>
  );
}
