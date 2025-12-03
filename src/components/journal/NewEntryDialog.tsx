import { useState, useEffect, useRef, useCallback } from "react";
import { X, Sparkles, Check, ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useImageUpload } from "./useImageUpload";
import { ImageGrid } from "./ImageGrid";

interface ExistingEntry {
  id: string;
  title: string;
  content: string;
  created_at: string;
  photos?: string[];
}

interface NewEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  prefillContent?: string;
  editEntry?: ExistingEntry | null;
  viewOnly?: boolean;
}

export const NewEntryDialog = ({ isOpen, onClose, prefillContent = '', editEntry, viewOnly = false }: NewEntryDialogProps) => {
  // If editing an existing entry, it's always view-only (sealed)
  const isReadOnly = viewOnly || !!editEntry;
  const [content, setContent] = useState(prefillContent);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activityPrompt, setActivityPrompt] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    images,
    uploadingImages,
    handleFiles,
    removeImage,
    initializeImages,
    clearImages,
    isUploading,
  } = useImageUpload(entryId);

  // Initialize from edit entry or prefill
  useEffect(() => {
    if (isOpen) {
      if (editEntry) {
        setContent(editEntry.content);
        setEntryId(editEntry.id);
        initializeImages(editEntry.photos || []);
      } else if (prefillContent) {
        setContent(prefillContent);
        setEntryId(null);
        clearImages();
      } else {
        setContent('');
        setEntryId(null);
        clearImages();
      }
    }
  }, [isOpen, editEntry, prefillContent, initializeImages, clearImages]);

  // Clipboard paste handler
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        handleFiles(imageFiles);
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [isOpen, handleFiles]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  // Fetch activity-aware prompt (only for new entries)
  useEffect(() => {
    const fetchActivityPrompt = async () => {
      if (editEntry) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: completedTasks } = await supabase
        .from('tasks')
        .select('title, category')
        .eq('user_id', user.id)
        .eq('completed', true)
        .gte('completed_at', today.toISOString());

      if (completedTasks && completedTasks.length > 0) {
        if (completedTasks.length >= 5) {
          setActivityPrompt(`You crushed ${completedTasks.length} tasks today. What made today productive?`);
        } else if (completedTasks.length >= 3) {
          setActivityPrompt(`You completed ${completedTasks.length} tasks. How are you feeling?`);
        } else if (completedTasks.some(t => t.category === 'work')) {
          setActivityPrompt(`You made progress on work today. How's it going?`);
        }
      }
    };
    
    if (isOpen && !editEntry) {
      fetchActivityPrompt();
    } else {
      setActivityPrompt(null);
    }
  }, [isOpen, editEntry]);

  const saveEntry = async (text: string, photos: string[]) => {
    if (!text.trim() && photos.length === 0) return;

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const firstLine = text.split('\n')[0].slice(0, 100) || "Untitled";

      if (entryId) {
        const { error } = await supabase
          .from("journal_entries")
          .update({
            title: firstLine,
            content: text.trim(),
            photos: photos.length > 0 ? photos : null,
          })
          .eq("id", entryId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("journal_entries")
          .insert({
            user_id: user.id,
            title: firstLine,
            content: text.trim(),
            photos: photos.length > 0 ? photos : null,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) setEntryId(data.id);
      }

      setShowSaved(true);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setShowSaved(false), 2000);

      queryClient.invalidateQueries({ queryKey: ["journal_entries"] });
    } catch (error) {
      console.error("Failed to save entry:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save on content or images change (debounced)
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      if (content || images.length > 0) {
        saveEntry(content, images);
      }
    }, 2000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [content, images]);

  // Handle seal/done - save immediately and close
  const handleSeal = async () => {
    if (content.trim() || images.length > 0) {
      await saveEntry(content, images);
    }
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = "";
    }
  };

  if (!isOpen) return null;

  const displayDate = editEntry 
    ? format(new Date(editEntry.created_at), "MMMM d, yyyy")
    : format(new Date(), "MMMM d, yyyy");

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 bg-background z-50 flex flex-col transition-colors ${
        isDragging ? "bg-primary/5" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 border-2 border-dashed border-primary/30 m-4 rounded-xl pointer-events-none">
          <div className="flex flex-col items-center gap-2 text-primary/60">
            <ImageIcon className="w-12 h-12" />
            <span className="text-sm font-medium">Drop images here</span>
          </div>
        </div>
      )}

      {/* Header - minimal with just date and close */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground/40 font-mono">
            {displayDate}
          </p>
          {isReadOnly && editEntry && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 rounded-full text-[10px] uppercase tracking-wider text-amber-600/70 font-mono">
              <Check className="w-3 h-3" />
              Sealed
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 -mr-2 text-foreground/30 hover:text-foreground/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Activity prompt */}
      {activityPrompt && (
        <div className="mx-6 mb-4 px-4 py-3 bg-amber-500/5 rounded-lg border border-amber-500/10">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-500/70 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground/50">
              {activityPrompt}
            </p>
          </div>
        </div>
      )}

      {/* Main writing area - centered with max-width */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-6 md:px-12 py-4">
          <div className="border-l border-foreground/[0.03] pl-6">
            {isReadOnly ? (
              <div className="w-full min-h-[50vh] font-mono text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap">
                {content || <span className="text-foreground/20">No content</span>}
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing..."
                autoFocus
                spellCheck={false}
                className="w-full min-h-[50vh] font-mono text-sm text-foreground/70 leading-relaxed bg-transparent placeholder:text-foreground/20 focus:outline-none resize-none"
              />
            )}

            {/* Images */}
            {(images.length > 0 || uploadingImages.length > 0) && (
              <div className="mt-6 pb-4">
                <ImageGrid
                  images={images}
                  uploadingImages={uploadingImages}
                  onRemove={isReadOnly ? undefined : removeImage}
                  editable={!isReadOnly}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer - minimal toolbar */}
      <footer className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Image upload button - only show when not read-only */}
          {!isReadOnly && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="p-2 text-foreground/30 hover:text-foreground/50 hover:bg-foreground/5 rounded-lg transition-colors"
                title="Add image"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              <span className={`text-[10px] uppercase tracking-widest text-muted-foreground/30 font-mono transition-opacity duration-300 ${showSaved ? 'opacity-100' : 'opacity-0'}`}>
                Saved
              </span>
            </>
          )}
        </div>
        
        {isReadOnly ? (
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm text-foreground/60 hover:text-foreground/80 transition-all border border-foreground/10"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        ) : (
          <button
            onClick={handleSeal}
            disabled={isSaving || isUploading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm text-foreground/60 hover:text-foreground/80 transition-all disabled:opacity-50"
            style={{
              background: (content.trim() || images.length > 0) 
                ? 'radial-gradient(circle at 30% 30%, #fffbf0, #fef3e2, #fde9c9)' 
                : 'transparent',
              boxShadow: (content.trim() || images.length > 0) 
                ? '0 4px 16px rgba(200, 170, 120, 0.12)' 
                : undefined,
              border: (content.trim() || images.length > 0) 
                ? 'none' 
                : '1px solid rgba(0,0,0,0.05)'
            }}
          >
            <Check className="w-4 h-4" />
            <span>{isUploading ? "Uploading..." : "Seal Entry"}</span>
          </button>
        )}
      </footer>
    </div>
  );
};
