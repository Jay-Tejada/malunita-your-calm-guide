import { Plus } from "lucide-react";
import { useState } from "react";
import { NewEntryDialog } from "./NewEntryDialog";

export const NewEntryButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-3 px-4 mb-6 border border-foreground/10 rounded-lg hover:border-foreground/20 transition-colors flex items-center justify-center gap-2 text-foreground/60 hover:text-foreground/80"
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm font-mono">New Entry</span>
      </button>

      {isOpen && (
        <NewEntryDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
