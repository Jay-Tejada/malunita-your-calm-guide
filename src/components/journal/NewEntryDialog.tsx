import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface NewEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewEntryDialog = ({ isOpen, onClose }: NewEntryDialogProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        description: "Please add a title and content",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("journal_entries")
        .insert({
          user_id: user.id,
          title: title.trim(),
          content: content.trim(),
        });

      if (error) throw error;

      toast({
        description: "Entry saved",
      });

      queryClient.invalidateQueries({ queryKey: ["journal_entries"] });
      onClose();
    } catch (error) {
      console.error("Failed to save entry:", error);
      toast({
        description: "Failed to save entry",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-background border border-foreground/10 rounded-lg w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-mono text-foreground/80">New Entry</h2>
          <button
            onClick={onClose}
            className="text-foreground/40 hover:text-foreground/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Entry title..."
          className="w-full px-3 py-2 mb-3 bg-transparent border border-foreground/10 rounded text-sm font-mono text-foreground/80 placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20"
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your thoughts..."
          rows={12}
          className="w-full px-3 py-2 mb-4 bg-transparent border border-foreground/10 rounded text-sm font-mono text-foreground/80 placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20 resize-none"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-mono text-foreground/60 hover:text-foreground/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-mono bg-foreground/10 hover:bg-foreground/20 text-foreground/80 rounded transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};
