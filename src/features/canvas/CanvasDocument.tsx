import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CanvasBlock } from "./CanvasBlock";
import { ReferenceCard } from "./ReferenceCard";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
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

  return (
    <div ref={containerRef} className="h-full overflow-y-auto">
      <div className="px-6 py-12 md:py-16">
        {/* Two-column grid for desktop */}
        <div className="lg:grid lg:grid-cols-[60%_40%] lg:gap-8 max-w-[1200px] mx-auto">
          {/* Left Column - Text Content */}
          <div className="max-w-[680px]">
            {/* Page Title */}
            <div className="mb-8">
              <input
                type="text"
                value={pageTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Untitled"
                className="w-full text-4xl md:text-5xl font-mono font-medium text-canvas-text bg-transparent border-none outline-none placeholder:text-canvas-text-muted/50"
              />
            </div>

            {/* Text Blocks */}
            <div className="space-y-1">
              {textBlocks.map((block) => (
                <CanvasBlock
                  key={block.id}
                  block={block}
                  pageId={page.id}
                  onCreateBelow={() => createBlock.mutate("text")}
                />
              ))}
            </div>

            {/* Add Block Button */}
            <div className="mt-4 group">
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
          </div>

          {/* Right Column - Art/Image Content (Desktop only) */}
          <div className="hidden lg:block max-w-[460px] self-start sticky top-24">
            <div className="space-y-4">
              {artBlocks.length > 0 ? (
                artBlocks.map((block) => (
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
                ))
              ) : (
                <div className="rounded-[14px] border border-dashed border-border/50 bg-muted/30 p-8 text-center text-muted-foreground font-mono text-sm">
                  Add image or gallery blocks to see them here
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile: Show art blocks inline after text */}
        <div className="lg:hidden mt-8 space-y-4">
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
        </div>

        {/* Bottom Padding */}
        <div className="h-48" />
      </div>
    </div>
  );
}
