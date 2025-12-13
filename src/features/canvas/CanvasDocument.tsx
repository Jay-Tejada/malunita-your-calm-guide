import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CanvasBlock } from "./CanvasBlock";
import { ReferenceCard } from "./ReferenceCard";
import { HoverAddButton } from "./HoverAddButton";
import { Input } from "@/components/ui/input";
import { Plus, Upload, X, Maximize2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import debounce from "@/lib/debounce";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [mobileFullscreenImage, setMobileFullscreenImage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete block mutation
  const deleteBlock = useMutation({
    mutationFn: async (blockId: string) => {
      const { error } = await supabase
        .from("page_blocks")
        .delete()
        .eq("id", blockId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas-blocks", page?.id] });
      toast.success("Image removed");
    },
  });

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
        
        {/* 1. MOBILE Layout (< 768px) */}
        <div className="md:hidden pb-20">
          {/* Title Area */}
          <div className="px-4 mb-6">
            <input
              type="text"
              value={pageTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Untitled"
              className="w-full text-3xl font-medium text-canvas-text bg-transparent border-none outline-none placeholder:text-canvas-text-muted/50"
            />
          </div>

          {/* Description / Text Blocks */}
          <div className="px-4 space-y-4 mb-6">
            {textBlocks.map((block) => (
              <div key={block.id} className="text-base">
                <CanvasBlock
                  block={block}
                  pageId={page.id}
                  onCreateBelow={() => createBlock.mutate("text")}
                />
              </div>
            ))}
          </div>

          {/* Art Blocks - Full width cards */}
          <div className="px-4 space-y-2">
            {artBlocks.map((block) => {
              const imageUrl = block.content?.url;
              if (!imageUrl) return null;
              
              return (
                <div 
                  key={block.id}
                  className="w-full rounded-lg overflow-hidden bg-muted/20"
                  onClick={() => setMobileFullscreenImage(imageUrl)}
                >
                  <img
                    src={imageUrl}
                    alt=""
                    className="w-full max-h-[200px] object-contain cursor-pointer"
                  />
                </div>
              );
            })}
          </div>

          {/* Sticky Add Block Button */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-canvas-bg via-canvas-bg to-transparent md:hidden">
            <Button
              variant="outline"
              className="w-full py-6 rounded-xl border-dashed border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 hover:bg-muted/20"
              onClick={() => createBlock.mutate("text")}
            >
              <Plus className="w-5 h-5 mr-2" />
              Add block
            </Button>
          </div>

          {/* Mobile Fullscreen Image Modal */}
          <Dialog open={!!mobileFullscreenImage} onOpenChange={() => setMobileFullscreenImage(null)}>
            <DialogContent className="max-w-full h-full p-0 bg-black/95 border-none">
              <button
                onClick={() => setMobileFullscreenImage(null)}
                className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              {mobileFullscreenImage && (
                <div className="flex items-center justify-center w-full h-full p-4">
                  <img
                    src={mobileFullscreenImage}
                    alt=""
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* DESKTOP Layout (>= 768px) */}

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
                      <div key={block.id} className="relative group">
                        <img
                          src={imageUrl}
                          alt=""
                          onClick={() => setExpandedImageId(isExpanded ? null : block.id)}
                          className={cn(
                            "w-full object-contain rounded-lg cursor-pointer transition-all duration-200",
                            isExpanded ? "max-h-[400px]" : "max-h-[100px]"
                          )}
                        />
                        {/* Hover action bar */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-md p-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedImageId(isExpanded ? null : block.id);
                            }}
                            className="p-1 text-white hover:opacity-80 transition-opacity"
                            title={isExpanded ? "Collapse" : "Expand"}
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                          <AlertDialog open={deleteConfirmId === block.id} onOpenChange={(open) => setDeleteConfirmId(open ? block.id : null)}>
                            <AlertDialogTrigger asChild>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(block.id);
                                }}
                                className="p-1 text-white hover:opacity-80 transition-opacity"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete image?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove this reference image.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    deleteBlock.mutate(block.id);
                                    setDeleteConfirmId(null);
                                  }}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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
