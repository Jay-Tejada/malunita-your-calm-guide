import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CanvasBlock } from "./CanvasBlock";
import { ReferenceCard } from "./ReferenceCard";
import { Input } from "@/components/ui/input";
import { Plus, Pin, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import debounce from "@/lib/debounce";
interface Block {
  id: string;
  block_type: string;
  content: any;
  sort_order: number | null;
  page_id: string;
}

interface Page {
  id: string;
  title: string;
  icon: string | null;
}

interface CanvasDocumentProps {
  page?: Page;
  blocks: Block[];
  onSectionChange: (sectionId: string | null) => void;
}

export function CanvasDocument({ page, blocks, onSectionChange }: CanvasDocumentProps) {
  const queryClient = useQueryClient();
  const [pageTitle, setPageTitle] = useState(page?.title || "");
  const [expandedImageId, setExpandedImageId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPageTitle(page?.title || "");
  }, [page?.title]);

  // Update page title mutation
  const updateTitle = useMutation({
    mutationFn: async (title: string) => {
      if (!page?.id) return;
      const { error } = await supabase
        .from("project_pages")
        .update({ title })
        .eq("id", page.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas-pages"] });
    },
  });

  // Debounced title save
  const debouncedSaveTitle = useCallback(
    debounce((title: string) => {
      if (title.trim()) {
        updateTitle.mutate(title);
      }
    }, 500),
    [page?.id]
  );

  const handleTitleChange = (value: string) => {
    setPageTitle(value);
    debouncedSaveTitle(value);
  };

  // Create block mutation
  const createBlock = useMutation({
    mutationFn: async (type: string = "text") => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !page?.id) throw new Error("Not authenticated");

      const maxOrder = Math.max(...blocks.map((b) => b.sort_order || 0), -1);
      const { data, error } = await supabase
        .from("page_blocks")
        .insert({
          page_id: page.id,
          user_id: user.id,
          block_type: type,
          content: type === "header" ? { text: "", level: 2 } : { text: "" },
          sort_order: maxOrder + 1,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas-blocks", page?.id] });
    },
  });

  // Track active section based on scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const headers = blocks.filter(
        (b) => b.block_type === "header" && b.content?.level === 1
      );
      
      for (const header of headers.reverse()) {
        const el = document.getElementById(`block-${header.id}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) {
            onSectionChange(header.id);
            return;
          }
        }
      }
      onSectionChange(null);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [blocks, onSectionChange]);

  if (!page) {
    return (
      <div className="flex items-center justify-center h-full text-canvas-text-muted font-mono">
        Select a page to begin
      </div>
    );
  }

  // Separate blocks into text content and image/art content
  const textBlocks = blocks.filter(
    (b) => !["image", "gallery"].includes(b.block_type)
  );
  const artBlocks = blocks.filter((b) =>
    ["image", "gallery"].includes(b.block_type)
  );

  // For tablet: split text blocks into "intro" (first 2) and "remaining"
  const introTextBlocks = textBlocks.slice(0, 2);
  const remainingTextBlocks = textBlocks.slice(2);

  return (
    <div ref={containerRef} className="h-full overflow-y-auto">
      <div className="py-12 md:py-16">
        
        {/* 1. MOBILE Layout (< 640px) - TEMP TESTING */}
        <div className="sm:hidden space-y-6 px-4">
          {/* Page Title */}
          <input
            type="text"
            value={pageTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled"
            className="w-full text-3xl font-mono font-medium text-canvas-text bg-transparent border-none outline-none placeholder:text-canvas-text-muted/50"
          />

          {/* All Text Blocks */}
          {textBlocks.map((block) => (
            <CanvasBlock
              key={block.id}
              block={block}
              pageId={page.id}
              onCreateBelow={() => createBlock.mutate("text")}
            />
          ))}

          {/* Art Blocks */}
          {artBlocks.map((block) => (
            <ReferenceCard 
              key={block.id}
              caption={block.content?.caption}
            >
              <CanvasBlock
                block={block}
                pageId={page.id}
                onCreateBelow={() => createBlock.mutate("image")}
              />
            </ReferenceCard>
          ))}

          {/* Add Block Button */}
          <Button
            variant="ghost"
            size="sm"
            className="text-canvas-text-muted hover:text-canvas-text font-mono text-sm opacity-50 hover:opacity-100 transition-opacity"
            onClick={() => createBlock.mutate("text")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add block
          </Button>
        </div>

        {/* 2. TABLET Layout (640px - 767px) - TEMP TESTING */}
        <div className="hidden sm:block md:hidden space-y-6 px-6">
          {/* Page Title */}
          <input
            type="text"
            value={pageTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled"
            className="w-full text-5xl font-mono font-medium text-canvas-text bg-transparent border-none outline-none placeholder:text-canvas-text-muted/50"
          />

          {/* All Text Blocks */}
          {textBlocks.map((block) => (
            <CanvasBlock
              key={block.id}
              block={block}
              pageId={page.id}
              onCreateBelow={() => createBlock.mutate("text")}
            />
          ))}

          {/* Art Blocks */}
          {artBlocks.map((block) => (
            <ReferenceCard 
              key={block.id}
              caption={block.content?.caption}
            >
              <CanvasBlock
                block={block}
                pageId={page.id}
                onCreateBelow={() => createBlock.mutate("image")}
              />
            </ReferenceCard>
          ))}

          {/* Add Block Button */}
          <Button
            variant="ghost"
            size="sm"
            className="text-canvas-text-muted hover:text-canvas-text font-mono text-sm opacity-50 hover:opacity-100 transition-opacity"
            onClick={() => createBlock.mutate("text")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add block
          </Button>
        </div>

        {/* 3. DESKTOP Layout (>= 768px) - TEMP TESTING */}
        <div className="hidden md:grid grid-cols-[1.5fr_1fr] gap-10 max-w-7xl mx-auto px-6">
          {/* LEFT Column - Title, Description, Text Blocks */}
          <div className="space-y-6">
            {/* Page Title */}
            <input
              type="text"
              value={pageTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Untitled"
              className="w-full text-5xl font-mono font-medium text-canvas-text bg-transparent border-none outline-none placeholder:text-canvas-text-muted/50 break-words"
            />

            {/* Text Blocks Only */}
            {textBlocks.map((block) => (
              <CanvasBlock
                key={block.id}
                block={block}
                pageId={page.id}
                onCreateBelow={() => createBlock.mutate("text")}
              />
            ))}

            {/* Add Block Button */}
            <Button
              variant="ghost"
              size="sm"
              className="text-canvas-text-muted hover:text-canvas-text font-mono text-sm opacity-50 hover:opacity-100 transition-opacity"
              onClick={() => createBlock.mutate("text")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add block
            </Button>
          </div>

          {/* RIGHT Column - Art/Image Blocks Only (sticky) */}
          <div className="sticky top-24 self-start space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto art-scrollbar max-w-[400px]">
            {artBlocks.length > 0 ? (
              <>
                {/* Expandable image carousel - raw images, no wrappers */}
                <div className="space-y-3">
                  {artBlocks.map((block) => {
                    const isExpanded = expandedImageId === block.id;
                    const hasExpanded = expandedImageId !== null;
                    const imageUrl = block.content?.url;
                    
                    // If no image uploaded yet, show the upload block
                    if (!imageUrl) {
                      return (
                        <div key={block.id} className="relative">
                          <CanvasBlock
                            block={block}
                            pageId={page.id}
                            onCreateBelow={() => createBlock.mutate("image")}
                          />
                        </div>
                      );
                    }
                    
                    return (
                      <div key={block.id} className="relative">
                        <img
                          src={imageUrl}
                          alt=""
                          onClick={() => setExpandedImageId(isExpanded ? null : block.id)}
                          className={cn(
                            "w-full object-contain rounded-lg cursor-pointer hover:opacity-80 transition-all duration-200",
                            isExpanded ? "max-h-[400px]" : "max-h-[100px]"
                          )}
                        />
                        {isExpanded && (
                          <Button
                            variant="secondary"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 bg-background/80 backdrop-blur-sm hover:bg-background"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedImageId(null);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Add reference button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground hover:text-foreground font-mono text-xs border border-dashed border-border/50 hover:border-border mt-2"
                  onClick={() => createBlock.mutate("image")}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add reference
                </Button>
              </>
            ) : (
              /* Empty state placeholder */
              <div 
                className="rounded-[14px] border-2 border-dashed border-border/40 bg-muted/20 p-12 text-center cursor-pointer hover:border-border/60 hover:bg-muted/30 transition-colors"
                onClick={() => createBlock.mutate("image")}
              >
                <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground/70 font-mono text-sm">
                  Drop inspiration here
                </p>
                <p className="text-muted-foreground/50 font-mono text-xs mt-1">
                  or click to add
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Padding */}
        <div className="h-48" />
      </div>
    </div>
  );
}
