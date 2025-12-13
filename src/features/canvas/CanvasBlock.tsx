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
  Upload,
  Loader2,
  LayoutGrid,
  X,
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
import { toast } from "sonner";
import { SlashCommandMenu } from "./SlashCommandMenu";

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
  { type: "image", label: "Image", icon: Image },
  { type: "gallery", label: "Gallery", icon: LayoutGrid },
  { type: "callout", label: "Callout", icon: Quote },
  { type: "divider", label: "Divider", icon: Minus },
];

export function CanvasBlock({ block, pageId, onCreateBelow }: CanvasBlockProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState(block.content);
  const [isUploading, setIsUploading] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const textRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageBlockRef = useRef<HTMLDivElement>(null);

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
          : type === "gallery"
          ? { images: [] }
          : type === "image"
          ? { url: "", caption: "" }
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

  // Handle input for slash command detection
  const handleTextInput = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || "";
    
    // Check for "/" at start of empty block
    if (text === "/" && block.block_type === "text") {
      const rect = e.currentTarget.getBoundingClientRect();
      setSlashMenuPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
      setShowSlashMenu(true);
    } else if (showSlashMenu && !text.startsWith("/")) {
      setShowSlashMenu(false);
    }
  };

  // Handle slash command selection
  const handleSlashSelect = (type: string, level?: number) => {
    setShowSlashMenu(false);
    // Clear the "/" from content
    if (textRef.current) {
      textRef.current.textContent = "";
    }
    setContent({ text: "" });
    changeType.mutate({ type, level });
  };

  const handleCheckToggle = () => {
    const newContent = { ...content, checked: !content.checked };
    setContent(newContent);
    updateBlock.mutate(newContent);
  };

  // Image upload handler
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not authenticated");
        return;
      }

      const ext = file.name.split(".").pop() || "jpg";
      const filename = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("canvas-images")
        .upload(filename, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("canvas-images")
        .getPublicUrl(filename);

      const newContent = { url: publicUrl, caption: "" };
      setContent(newContent);
      updateBlock.mutate(newContent);
      toast.success("Image uploaded!");
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  // Gallery image upload handler (adds to array)
  const handleGalleryUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not authenticated");
        return;
      }

      const ext = file.name.split(".").pop() || "jpg";
      const filename = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("canvas-images")
        .upload(filename, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("canvas-images")
        .getPublicUrl(filename);

      const currentImages = content?.images || [];
      const newContent = { images: [...currentImages, publicUrl] };
      setContent(newContent);
      updateBlock.mutate(newContent);
      toast.success("Image added to gallery!");
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  // Remove image from gallery
  const handleRemoveFromGallery = (index: number) => {
    const currentImages = content?.images || [];
    const newImages = currentImages.filter((_: string, i: number) => i !== index);
    const newContent = { images: newImages };
    setContent(newContent);
    updateBlock.mutate(newContent);
  };

  // Handle paste event for images
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (block.block_type !== "image" && block.block_type !== "gallery") return;
    
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          if (block.block_type === "gallery") {
            handleGalleryUpload(file);
          } else {
            handleImageUpload(file);
          }
        }
        break;
      }
    }
  }, [block.block_type, content]);

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
          <div 
            ref={imageBlockRef}
            className="relative group outline-none" 
            onPaste={handlePaste}
            onMouseEnter={() => imageBlockRef.current?.focus()}
            tabIndex={0}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
            />
            {content?.url ? (
              <>
                <img
                  src={content.url}
                  alt={content.caption || ""}
                  className="w-full rounded-lg cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                />
                {content.caption && (
                  <p className="text-center text-sm text-canvas-text-muted mt-2 font-mono">
                    {content.caption}
                  </p>
                )}
              </>
            ) : (
              <div 
                className="border-2 border-dashed border-canvas-border rounded-lg p-8 text-center cursor-pointer hover:border-canvas-accent transition-colors focus:border-canvas-accent focus:outline-none"
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-8 h-8 mx-auto text-canvas-text-muted mb-2 animate-spin" />
                    <p className="text-canvas-text-muted font-mono text-sm">
                      Uploading...
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto text-canvas-text-muted mb-2" />
                    <p className="text-canvas-text-muted font-mono text-sm">
                      Click or paste (Ctrl+V) to add image
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        );

      case "gallery":
        const images = content?.images || [];
        return (
          <div 
            ref={imageBlockRef}
            className="relative group outline-none" 
            onPaste={handlePaste}
            onMouseEnter={() => imageBlockRef.current?.focus()}
            tabIndex={0}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files;
                if (files) {
                  Array.from(files).forEach(file => handleGalleryUpload(file));
                }
              }}
            />
            {images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {images.map((url: string, index: number) => (
                  <div key={index} className="relative group/image aspect-square">
                    <img
                      src={url}
                      alt={`Gallery image ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleRemoveFromGallery(index)}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-black/70"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
                <div 
                  className="aspect-square border-2 border-dashed border-canvas-border rounded-lg flex items-center justify-center cursor-pointer hover:border-canvas-accent transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 text-canvas-text-muted animate-spin" />
                  ) : (
                    <Plus className="w-6 h-6 text-canvas-text-muted" />
                  )}
                </div>
              </div>
            ) : (
              <div 
                className="border-2 border-dashed border-canvas-border rounded-lg p-8 text-center cursor-pointer hover:border-canvas-accent transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-8 h-8 mx-auto text-canvas-text-muted mb-2 animate-spin" />
                    <p className="text-canvas-text-muted font-mono text-sm">
                      Uploading...
                    </p>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="w-8 h-8 mx-auto text-canvas-text-muted mb-2" />
                    <p className="text-canvas-text-muted font-mono text-sm">
                      Click or paste to add images
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        );

      default: // text
        return (
          <>
            <div
              ref={textRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleTextInput}
              onBlur={(e) => {
                handleTextChange(e.currentTarget.textContent || "");
                // Delay hiding menu to allow click
                setTimeout(() => {
                  if (!showSlashMenu) return;
                  setShowSlashMenu(false);
                }, 200);
              }}
              data-placeholder="Type '/' for commands..."
              className={cn(
                "outline-none text-canvas-text leading-relaxed",
                "empty:before:content-[attr(data-placeholder)] empty:before:text-canvas-text-muted/50"
              )}
              dangerouslySetInnerHTML={{ __html: content?.text || "" }}
            />
            {showSlashMenu && (
              <SlashCommandMenu
                position={slashMenuPosition}
                onSelect={handleSlashSelect}
                onClose={() => setShowSlashMenu(false)}
              />
            )}
          </>
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
