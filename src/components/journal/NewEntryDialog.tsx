import { useState, useEffect, useRef } from "react";
import { X, Sparkles, Check } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface ExistingEntry {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface NewEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  prefillContent?: string;
  editEntry?: ExistingEntry | null;
}

export const NewEntryDialog = ({ isOpen, onClose, prefillContent = '', editEntry }: NewEntryDialogProps) => {
  const [content, setContent] = useState(prefillContent);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activityPrompt, setActivityPrompt] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize from edit entry or prefill
  useEffect(() => {
    if (isOpen) {
      if (editEntry) {
        setContent(editEntry.content);
        setEntryId(editEntry.id);
      } else if (prefillContent) {
        setContent(prefillContent);
        setEntryId(null);
      } else {
        setContent('');
        setEntryId(null);
      }
    }
  }, [isOpen, editEntry, prefillContent]);

  // Fetch activity-aware prompt (only for new entries)
  useEffect(() => {
    const fetchActivityPrompt = async () => {
      if (editEntry) return; // Don't show prompt when editing
      
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

  const saveEntry = async (text: string) => {
    if (!text.trim()) return;

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

  // Auto-save on content change (debounced)
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      if (content) saveEntry(content);
    }, 2000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [content]);

  // Handle seal/done - save immediately and close
  const handleSeal = async () => {
    if (content.trim()) {
      await saveEntry(content);
    }
    onClose();
  };

  if (!isOpen) return null;

  const displayDate = editEntry 
    ? format(new Date(editEntry.created_at), "MMMM d, yyyy")
    : format(new Date(), "MMMM d, yyyy");

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-foreground/5">
        <div className="text-xs text-muted-foreground/40">
          {displayDate}
        </div>
        <button
          onClick={onClose}
          className="text-foreground/40 hover:text-foreground/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Activity prompt */}
      {activityPrompt && (
        <div className="px-6 py-3 bg-amber-500/5 border-b border-amber-500/10">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-500/70 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground/60">
              {activityPrompt}
            </p>
          </div>
        </div>
      )}

      {/* Main textarea */}
      <div className="flex-1 px-6 py-6 overflow-auto">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing..."
          autoFocus
          className="w-full h-full min-h-[50vh] font-mono text-base text-foreground/80 bg-transparent placeholder:text-foreground/30 focus:outline-none resize-none"
        />
      </div>

      {/* Footer with Seal button */}
      <div className="px-6 py-4 border-t border-foreground/5 flex items-center justify-between">
        <div className={`text-xs text-muted-foreground/40 transition-opacity duration-300 ${showSaved ? 'opacity-100' : 'opacity-0'}`}>
          Saved
        </div>
        
        <button
          onClick={handleSeal}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-foreground/60 hover:text-foreground/90 hover:bg-foreground/5 transition-colors"
          style={{
            background: content.trim() ? 'radial-gradient(circle at 30% 30%, #fffbf0, #fef3e2, #fde9c9)' : undefined,
            boxShadow: content.trim() ? '0 4px 12px rgba(200, 170, 120, 0.15)' : undefined
          }}
        >
          <Check className="w-4 h-4" />
          <span>Seal Entry</span>
        </button>
      </div>
    </div>
  );
};
