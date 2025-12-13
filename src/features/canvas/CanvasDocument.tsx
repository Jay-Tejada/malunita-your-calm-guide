import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CanvasBlock } from "./CanvasBlock";
import { HoverAddButton } from "./HoverAddButton";
import { LayoutToggle } from "./LayoutToggle";
import { SortableBlock } from "./SortableBlock";
import { SortableImageBlock } from "./SortableImageBlock";
import { Plus, Upload, X, Maximize2, Trash2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
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

type LayoutMode = "grid" | "split";

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
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("canvas-layout-mode");
      // Convert legacy "inline" to "grid" for backwards compatibility
      if (stored === "inline") return "grid";
      if (stored === "grid" || stored === "split") return stored;
    }
    return "split";
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Persist layout mode preference
  const handleLayoutChange = (mode: LayoutMode) => {
    console.log('Switching to:', mode);
    setLayoutMode(mode);
    localStorage.setItem("canvas-layout-mode", mode);
  };

  // Debug: Log layout mode changes
  useEffect(() => {
    console.log('Layout mode:', layoutMode);
  }, [layoutMode]);

  // Keyboard shortcuts for layout switching (Ctrl+1 = Grid, Ctrl+2 = Split)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "1") {
        e.preventDefault();
        handleLayoutChange("grid");
      } else if ((e.ctrlKey || e.metaKey) && e.key === "2") {
        e.preventDefault();
        handleLayoutChange("split");
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Reorder blocks mutation
  const reorderBlocks = useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      const promises = updates.map(({ id, sort_order }) =>
        supabase
          .from("page_blocks")
          .update({ sort_order })
          .eq("id", id)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas-blocks", page?.id] });
    },
  });

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent, blockList: Block[]) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blockList.findIndex((b) => b.id === active.id);
    const newIndex = blockList.findIndex((b) => b.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(blockList, oldIndex, newIndex);
    const updates = reordered.map((block, index) => ({
      id: block.id,
      sort_order: index,
    }));
    
    reorderBlocks.mutate(updates);
  };

  // Separate blocks into text content and image/art content (moved up for navigation)
  const textBlocks = blocks.filter(
    (b) => !["image", "gallery"].includes(b.block_type)
  );
  const artBlocks = blocks.filter((b) =>
    ["image", "gallery"].includes(b.block_type)
  );

  // Focus a specific block by id
  const focusBlock = useCallback((blockId: string) => {
    setTimeout(() => {
      const blockEl = document.querySelector(`[data-block-id="${blockId}"] [contenteditable]`) as HTMLElement;
      if (blockEl) {
        blockEl.focus();
        // Move cursor to end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(blockEl);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 50);
  }, []);

  // Handle navigation between blocks
  const handleBlockNavigate = useCallback((currentIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex >= 0 && targetIndex < textBlocks.length) {
      focusBlock(textBlocks[targetIndex].id);
    } else if (direction === 'up' && currentIndex === 0) {
      // Focus title when navigating up from first block
      titleInputRef.current?.focus();
    }
  }, [textBlocks, focusBlock]);

  // Auto-focus title on new/empty pages
  useEffect(() => {
    if (page && pageTitle === "Untitled" && blocks.length === 0) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [page?.id]);

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

  // For tablet: split text blocks into "intro" (first 2) and "remaining"
  const introTextBlocks = textBlocks.slice(0, 2);
  const remainingTextBlocks = textBlocks.slice(2);

  return (
    <div ref={containerRef} className="h-full overflow-y-auto relative">
      {/* DEBUG: Mode indicator banners */}
      {layoutMode === "split" && (
        <div className="fixed top-0 left-0 bg-green-500 text-black p-4 z-50">
          SPLIT MODE ACTIVE
        </div>
      )}
      {layoutMode === "grid" && (
        <div className="fixed top-0 left-0 bg-yellow-500 text-black p-4 z-50">
          GRID MODE ACTIVE
        </div>
      )}

      {/* Layout Toggle - Fixed top-right, hidden on mobile */}
      <div className="hidden md:block fixed top-20 right-6 z-50">
        <LayoutToggle value={layoutMode} onChange={handleLayoutChange} />
      </div>
      
      <div className="py-12 md:py-16">
        
        {/* 1. MOBILE Layout (< 768px) */}
        <div className="md:hidden pb-20">
          {/* Title Area */}
          <div className="px-4 mb-6">
            <input
              ref={titleInputRef}
              type="text"
              value={pageTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Untitled"
              className="w-full text-3xl font-medium text-canvas-text bg-transparent border-none outline-none placeholder:text-canvas-text-muted/50"
            />
          </div>

          {/* Description / Text Blocks */}
          <div className="px-4 space-y-4 mb-6">
            {textBlocks.length === 0 ? (
              <button
                onClick={() => createBlock.mutate("text")}
                className="w-full py-8 text-center text-muted-foreground/50 hover:text-muted-foreground transition-colors duration-150"
              >
                Start writing...
              </button>
            ) : (
              textBlocks.map((block) => (
                <div key={block.id} className="text-base">
                  <CanvasBlock
                    block={block}
                    pageId={page.id}
                    onCreateBelow={() => createBlock.mutate("text")}
                  />
                </div>
              ))
            )}
          </div>

          {/* Art Blocks - Full width cards */}
          <div className="px-4 space-y-2">
            {artBlocks.length === 0 ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 rounded-lg border border-dashed border-muted-foreground/20 text-muted-foreground/40 hover:border-muted-foreground/40 hover:text-muted-foreground/60 transition-colors duration-150 text-sm"
              >
                Add reference images
              </button>
            ) : (
              artBlocks.map((block) => {
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
                      className="w-full max-h-[200px] object-contain cursor-pointer transition-transform duration-200 ease-out active:scale-[0.98] motion-reduce:transition-none"
                    />
                  </div>
                );
              })
            )}
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
            <DialogContent className="max-w-full h-full p-0 bg-black/95 border-none animate-fade-in motion-reduce:animate-none">
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

        {/* 2. TABLET Layout (768px - 1023px) */}
        <div className="hidden md:block lg:hidden px-8">
          <div className="max-w-[720px] mx-auto">
            {/* Title */}
            <input
              type="text"
              value={pageTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Untitled"
              className="w-full text-4xl font-medium text-canvas-text bg-transparent border-none outline-none placeholder:text-canvas-text-muted/50 mb-4"
            />

            {/* Intro Text (first 2 blocks) or empty state */}
            <div className="space-y-4 mb-8">
              {introTextBlocks.length === 0 ? (
                <button
                  onClick={() => createBlock.mutate("text")}
                  className="w-full py-8 text-center text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors duration-150"
                >
                  Start writing...
                </button>
              ) : (
                introTextBlocks.map((block) => (
                  <div key={block.id} className="text-base leading-relaxed">
                    <CanvasBlock
                      block={block}
                      pageId={page.id}
                      onCreateBelow={() => createBlock.mutate("text")}
                    />
                  </div>
                ))
              )}
            </div>

            {/* Images in 2-column grid or empty state */}
            {artBlocks.length === 0 ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 mb-8 rounded-lg border border-dashed border-muted-foreground/20 text-muted-foreground/40 hover:border-muted-foreground/40 hover:text-muted-foreground/60 transition-colors duration-150 text-sm"
              >
                Add reference images
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3 mb-8">
                {artBlocks.map((block) => {
                  const imageUrl = block.content?.url;
                  if (!imageUrl) return null;
                  
                  return (
                    <div 
                      key={block.id}
                      className="aspect-square bg-white/5 rounded-xl overflow-hidden flex items-center justify-center p-3 cursor-pointer hover:bg-white/10 transition-colors relative group"
                      onClick={() => setMobileFullscreenImage(imageUrl)}
                    >
                      <img
                        src={imageUrl}
                        alt=""
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Remaining Text Blocks */}
            {remainingTextBlocks.length > 0 && (
              <div className="space-y-4 mb-8">
                {remainingTextBlocks.map((block) => (
                  <div key={block.id} className="text-base leading-relaxed">
                    <CanvasBlock
                      block={block}
                      pageId={page.id}
                      onCreateBelow={() => createBlock.mutate("text")}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Add Block Button */}
            <Button
              variant="outline"
              className="w-full py-4 rounded-lg border-dashed border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 hover:bg-muted/20"
              onClick={() => createBlock.mutate("text")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add block
            </Button>
          </div>

          {/* Tablet Fullscreen Image Modal */}
          <Dialog open={!!mobileFullscreenImage} onOpenChange={() => setMobileFullscreenImage(null)}>
            <DialogContent className="max-w-[90vw] max-h-[90vh] p-4 bg-black/95 border-none animate-fade-in motion-reduce:animate-none">
              <button
                onClick={() => setMobileFullscreenImage(null)}
                className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              {mobileFullscreenImage && (
                <div className="flex items-center justify-center w-full h-full">
                  <img
                    src={mobileFullscreenImage}
                    alt=""
                    className="max-w-full max-h-[80vh] object-contain"
                  />
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* 3. DESKTOP Layout (>= 1024px) */}
        <div className="hidden lg:block max-w-7xl mx-auto px-16">

          {/* SPLIT MODE - Two column layout using flexbox */}
          {layoutMode === "split" && (
            <div style={{ border: '5px solid blue', display: 'flex', gap: '40px', maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
              
              {/* LEFT - Text */}
              <div style={{ flex: '1.5', minWidth: 0 }}>
                <input
                  value={pageTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Untitled"
                  className="w-full text-5xl font-medium text-canvas-text bg-transparent border-none outline-none placeholder:text-canvas-text-muted/50 mb-4"
                />
                <p className="text-muted-foreground mb-6">Text content goes here</p>
                <div className="space-y-4">
                  {textBlocks.map((block) => (
                    <CanvasBlock 
                      key={block.id} 
                      block={block} 
                      pageId={page.id}
                      onCreateBelow={() => createBlock.mutate("text")}
                    />
                  ))}
                </div>
              </div>

              {/* RIGHT - Images */}
              <div style={{ flex: '1', position: 'sticky', top: '96px', alignSelf: 'flex-start' }}>
                <div className="space-y-3">
                  {artBlocks.map((block) => (
                    <img 
                      key={block.id}
                      src={block.content?.url || block.content}
                      alt=""
                      className="w-full rounded-lg"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* GRID MODE - Single column, images in 2-col grid below text */}
          {layoutMode === "grid" && (
            <div style={{ border: '5px solid red' }} className="space-y-6 max-w-3xl mx-auto transition-all duration-300 ease-out motion-reduce:transition-none">
            {/* Title Area */}
            <div className="border-b border-white/5 pb-6 mb-8">
              <input
                type="text"
                value={pageTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.key === 'ArrowDown' || e.key === 'Enter') && blocks.length > 0) {
                    e.preventDefault();
                    const firstTextBlock = textBlocks[0];
                    if (firstTextBlock) focusBlock(firstTextBlock.id);
                  }
                }}
                placeholder="Untitled"
                className="w-full text-5xl font-medium text-canvas-text bg-transparent border-none outline-none placeholder:text-canvas-text-muted/50 break-words mb-4"
              />
            </div>

            {/* All blocks in order */}
            <div className="space-y-6">
              {blocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <button
                    onClick={() => createBlock.mutate("text")}
                    className="text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors duration-150 text-lg"
                  >
                    Start writing...
                  </button>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => handleDragEnd(e, blocks)}
                >
                  <SortableContext
                    items={blocks.map(b => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {blocks.map((block, index) => {
                      // For image blocks in inline mode
                      if (["image", "gallery"].includes(block.block_type)) {
                        const imageUrl = block.content?.url;
                        if (!imageUrl) {
                          return (
                            <SortableBlock key={block.id} id={block.id}>
                              <HoverAddButton onAddBlock={(type) => createBlock.mutate(type)} />
                              <CanvasBlock
                                block={block}
                                pageId={page.id}
                                onCreateBelow={() => createBlock.mutate("text")}
                              />
                            </SortableBlock>
                          );
                        }
                        
                        return (
                          <SortableBlock key={block.id} id={block.id}>
                            <HoverAddButton onAddBlock={(type) => createBlock.mutate(type)} />
                            <div className="aspect-square bg-white/5 rounded-xl overflow-hidden flex items-center justify-center p-3 cursor-pointer hover:bg-white/10 transition-colors relative group max-w-md">
                              <img
                                src={imageUrl}
                                alt=""
                                className="max-w-full max-h-full object-contain"
                              />
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-md p-1">
                                <AlertDialog open={deleteConfirmId === block.id} onOpenChange={(open) => setDeleteConfirmId(open ? block.id : null)}>
                                  <AlertDialogTrigger asChild>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirmId(block.id);
                                      }}
                                      className="p-1 text-white hover:opacity-80 transition-opacity duration-150"
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
                          </SortableBlock>
                        );
                      }
                      
                      // Text blocks
                      const textBlockIndex = textBlocks.findIndex(tb => tb.id === block.id);
                      return (
                        <SortableBlock key={block.id} id={block.id}>
                          <div data-block-id={block.id}>
                            {index === 0 && (
                              <HoverAddButton onAddBlock={(type) => createBlock.mutate(type)} />
                            )}
                            <CanvasBlock
                              block={block}
                              pageId={page.id}
                              onCreateBelow={() => createBlock.mutate("text")}
                              onNavigate={textBlockIndex >= 0 ? (direction) => handleBlockNavigate(textBlockIndex, direction) : undefined}
                            />
                            <HoverAddButton onAddBlock={(type) => createBlock.mutate(type)} />
                          </div>
                        </SortableBlock>
                      );
                    })}
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {/* Hidden file input for inline mode */}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
          )}
        </div>

        {/* Bottom Padding */}
        <div className="h-48" />
      </div>
    </div>
  );
}
