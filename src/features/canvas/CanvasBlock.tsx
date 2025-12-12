import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  GripVertical,
  Plus,
  Trash2,
  Type,
  Heading1,
  Heading2,
  CheckSquare,
  Image,
  Quote,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import debounce from "@/lib/debounce";

interface Block {
  id: string;
  block_type: string;
  content: any;
  sort_order: number | null;
  page_id: string;
}

interface CanvasBlockProps {
  block: Block;
  pageId: string;
  onCreateBelow: () => void;
}

const blockTypes = [
  { type: "text", label: "Text", icon: Type },
  { type: "header", label: "Heading 1", icon: Heading1, level: 1 },
  { type: "header", label: "Heading 2", icon: Heading2, level: 2 },
  { type: "checklist", label: "Checklist", icon: CheckSquare },
  { type: "callout", label: "Callout", icon: Quote },
  { type: "divider", label: "Divider", icon: Minus },
];

export function CanvasBlock({ block, pageId, onCreateBelow }: CanvasBlockProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState(block.content);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setContent(block.content);
  }, [block.content]);

  // Update block mutation
  const updateBlock = useMutation({
    mutationFn: async (newContent: any) => {
      const { error } = await supabase
        .from("page_blocks")
        .update({ content: newContent })
        .eq("id", block.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas-blocks", pageId] });
    },
  });

  // Change block type mutation
  const changeType = useMutation({
    mutationFn: async ({
      type,
      level,
    }: {
      type: string;
      level?: number;
    }) => {
      const newContent =
        type === "header"
          ? { text: content?.text || "", level: level || 1 }
          : type === "checklist"
          ? { text: content?.text || "", checked: false }
          : type === "divider"
          ? {}
          : { text: content?.text || "" };

      const { error } = await supabase
        .from("page_blocks")
        .update({ block_type: type, content: newContent })
        .eq("id", block.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas-blocks", pageId] });
    },
  });

  // Delete block mutation
  const deleteBlock = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("page_blocks")
        .delete()
        .eq("id", block.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas-blocks", pageId] });
    },
  });

  // Debounced save
  const debouncedSave = useCallback(
    debounce((newContent: any) => {
      updateBlock.mutate(newContent);
    }, 500),
    [block.id]
  );

  const handleTextChange = (text: string) => {
    const newContent = { ...content, text };
    setContent(newContent);
    debouncedSave(newContent);
  };

  const handleCheckToggle = () => {
    const newContent = { ...content, checked: !content.checked };
    setContent(newContent);
    updateBlock.mutate(newContent);
  };

  // Render based on block type
  const renderBlockContent = () => {
    switch (block.block_type) {
      case "header":
        const level = content?.level || 1;
        const HeadingTag = level === 1 ? "h1" : "h2";
        return (
          <HeadingTag
            id={`block-${block.id}`}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleTextChange(e.currentTarget.textContent || "")}
            className={cn(
              "outline-none font-mono",
              level === 1
                ? "text-2xl font-semibold text-canvas-text"
                : "text-xl font-medium text-canvas-text"
            )}
            dangerouslySetInnerHTML={{ __html: content?.text || "" }}
          />
        );

      case "checklist":
        return (
          <div className="flex items-start gap-3">
            <Checkbox
              checked={content?.checked || false}
              onCheckedChange={handleCheckToggle}
              className="mt-1 border-canvas-border"
            />
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleTextChange(e.currentTarget.textContent || "")}
              className={cn(
                "flex-1 outline-none text-canvas-text leading-relaxed",
                content?.checked && "line-through text-canvas-text-muted"
              )}
              dangerouslySetInnerHTML={{ __html: content?.text || "" }}
            />
          </div>
        );

      case "callout":
        return (
          <div className="border-l-4 border-canvas-accent pl-4 py-2 bg-canvas-sidebar/50 rounded-r">
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleTextChange(e.currentTarget.textContent || "")}
              className="outline-none text-canvas-text leading-relaxed italic"
              dangerouslySetInnerHTML={{ __html: content?.text || "" }}
            />
          </div>
        );

      case "divider":
        return <hr className="border-canvas-border my-4" />;

      case "image":
        return (
          <div className="relative group">
            {content?.url ? (
              <>
                <img
                  src={content.url}
                  alt={content.caption || ""}
                  className="w-full rounded-lg"
                />
                {content.caption && (
                  <p className="text-center text-sm text-canvas-text-muted mt-2 font-mono">
                    {content.caption}
                  </p>
                )}
              </>
            ) : (
              <div className="border-2 border-dashed border-canvas-border rounded-lg p-8 text-center">
                <Image className="w-8 h-8 mx-auto text-canvas-text-muted mb-2" />
                <p className="text-canvas-text-muted font-mono text-sm">
                  Click to add image
                </p>
              </div>
            )}
          </div>
        );

      default: // text
        return (
          <div
            ref={textRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleTextChange(e.currentTarget.textContent || "")}
            data-placeholder="Type something..."
            className={cn(
              "outline-none text-canvas-text leading-relaxed",
              "empty:before:content-[attr(data-placeholder)] empty:before:text-canvas-text-muted/50"
            )}
            dangerouslySetInnerHTML={{ __html: content?.text || "" }}
          />
        );
    }
  };

  return (
    <div className="group relative flex items-start gap-1 py-1 -ml-12 pl-12">
      {/* Block Controls */}
      <div className="absolute left-0 top-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-canvas-text-muted hover:text-canvas-text"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {blockTypes.map((bt, i) => (
              <DropdownMenuItem
                key={`${bt.type}-${bt.level || i}`}
                onClick={() => changeType.mutate({ type: bt.type, level: bt.level })}
              >
                <bt.icon className="w-4 h-4 mr-2" />
                {bt.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => deleteBlock.mutate()}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-canvas-text-muted hover:text-canvas-text cursor-grab"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Block Content */}
      <div className="flex-1 min-w-0">{renderBlockContent()}</div>
    </div>
  );
}
