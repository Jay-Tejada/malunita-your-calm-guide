import { useState } from "react";
import { NewEntryDialog } from "./NewEntryDialog";

export const NewEntryButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setIsOpen(true)}
          className="text-sm text-foreground/50 hover:text-foreground/70 transition-colors"
        >
          + New entry
        </button>
      </div>

      {isOpen && (
        <NewEntryDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
