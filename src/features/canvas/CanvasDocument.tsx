import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CanvasBlock } from "./CanvasBlock";
import { ReferenceCard } from "./ReferenceCard";
import { HoverAddButton } from "./HoverAddButton";
import { Input } from "@/components/ui/input";
import { Plus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import debounce from "@/lib/debounce";
import { toast } from "sonner";
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
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Upload image and create block
  const uploadImage = async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !page?.id) {
      toast.error("Not authenticated");
      return;
    }

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${page.id}/${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("canvas-images")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Failed to upload image");
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("canvas-images")
      .getPublicUrl(filePath);

    const maxOrder = Math.max(...blocks.map((b) => b.sort_order || 0), -1);
    const { error } = await supabase
      .from("page_blocks")
      .insert({
        page_id: page.id,
        user_id: user.id,
        block_type: "image",
        content: { url: publicUrl },
        sort_order: maxOrder + 1,
      });

    if (error) {
      toast.error("Failed to create image block");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["canvas-blocks", page?.id] });
    toast.success("Image uploaded");
  };

  // Handle file input change
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(uploadImage);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const imageFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
      if (imageFiles.length === 0) {
        toast.error("Please drop image files only");
        return;
      }
      imageFiles.forEach(uploadImage);
    }
  };

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
        
        {/* 1. MOBILE Layout (< 640px) */}
        <div className="sm:hidden space-y-6 px-8">
          {/* Title Area with separator */}
          <div className="border-b border-white/5 pb-6 mb-8">
            <input
              type="text"
              value={pageTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Untitled"
              className="w-full text-4xl font-medium text-canvas-text bg-transparent border-none outline-none placeholder:text-canvas-text-muted/50 mb-4"
            />
          </div>

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

        {/* 2. TABLET Layout (640px - 767px) */}
        <div className="hidden sm:block md:hidden space-y-6 px-12">
          {/* Title Area with separator */}
          <div className="border-b border-white/5 pb-6 mb-8">
            <input
              type="text"
              value={pageTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Untitled"
              className="w-full text-5xl font-medium text-canvas-text bg-transparent border-none outline-none placeholder:text-canvas-text-muted/50 mb-4"
            />
          </div>

          {/* All Text Blocks with hover add buttons */}
          {textBlocks.map((block, index) => (
            <div key={block.id}>
              {index === 0 && (
                <HoverAddButton onAddBlock={(type) => createBlock.mutate(type)} />
              )}
              <CanvasBlock
                block={block}
                pageId={page.id}
                onCreateBelow={() => createBlock.mutate("text")}
              />
              <HoverAddButton onAddBlock={(type) => createBlock.mutate(type)} />
            </div>
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

          {/* Initial add button when no blocks */}
          {textBlocks.length === 0 && (
            <HoverAddButton onAddBlock={(type) => createBlock.mutate(type)} />
          )}
        </div>

        {/* 3. DESKTOP Layout (>= 768px) */}
        <div className="hidden md:grid grid-cols-[1.5fr_1fr] gap-10 max-w-7xl mx-auto px-16">
          {/* LEFT Column - Title, Description, Text Blocks */}
          <div className="space-y-6">
            {/* Title Area with separator */}
            <div className="border-b border-white/5 pb-6 mb-8">
              <input
                type="text"
                value={pageTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Untitled"
                className="w-full text-5xl font-medium text-canvas-text bg-transparent border-none outline-none placeholder:text-canvas-text-muted/50 break-words mb-4"
              />
            </div>

            {/* Text Blocks with hover add buttons */}
            {textBlocks.map((block, index) => (
              <div key={block.id}>
                {index === 0 && (
                  <HoverAddButton onAddBlock={(type) => createBlock.mutate(type)} />
                )}
                <CanvasBlock
                  block={block}
                  pageId={page.id}
                  onCreateBelow={() => createBlock.mutate("text")}
                />
                <HoverAddButton onAddBlock={(type) => createBlock.mutate(type)} />
              </div>
            ))}

            {/* Initial add button when no blocks */}
            {textBlocks.length === 0 && (
              <HoverAddButton onAddBlock={(type) => createBlock.mutate(type)} />
            )}
          </div>

          {/* RIGHT Column - Art/Image Blocks Only (sticky) */}
          <div 
            className={cn(
              "sticky top-24 self-start space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto art-scrollbar max-w-[400px] rounded-lg transition-all duration-200",
              isDraggingOver && "ring-2 ring-primary/50 bg-primary/5"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            {artBlocks.length > 0 ? (
              <>
                {/* Expandable image carousel - raw images, no wrappers */}
                <div className="space-y-3">
                  {artBlocks.map((block) => {
                    const isExpanded = expandedImageId === block.id;
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
                
                {/* Add reference button - dashed border, rounded-lg */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 mt-2 rounded-lg border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60 hover:bg-muted/30 hover:text-foreground transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </>
            ) : (
              /* Empty state placeholder with drop zone */
              <div 
                className={cn(
                  "rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/10 p-12 text-center cursor-pointer transition-all duration-200",
                  isDraggingOver 
                    ? "border-primary/60 bg-primary/10" 
                    : "hover:border-muted-foreground/50 hover:bg-muted/20"
                )}
                onClick={() => fileInputRef.current?.click()}
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
