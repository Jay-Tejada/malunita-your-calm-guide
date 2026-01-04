// src/ui/CaptureInput.tsx

import { useState } from "react";
import { colors, typography, layout } from "@/ui/tokens";

interface CaptureInputProps {
  placeholder?: string;
  onSubmit: (value: string) => void;
  isLoading?: boolean;
}

export function CaptureInput({
  placeholder = "Capture a thought...",
  onSubmit,
  isLoading = false,
}: CaptureInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (value.trim() && !isLoading) {
      onSubmit(value.trim());
      setValue("");
    }
  };

  return (
    <div
      className="flex items-center gap-3 bg-surface border border-border rounded-xl p-3 px-4"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
        style={{
          fontFamily: typography.fontFamily,
          fontSize: typography.bodyM.size,
        }}
        disabled={isLoading}
      />
      <button
        onClick={handleSubmit}
        disabled={!value.trim() || isLoading}
        className="flex-shrink-0 transition-opacity text-primary font-medium"
        style={{
          opacity: value.trim() ? 1 : 0.4,
          fontFamily: typography.fontFamily,
          fontSize: typography.bodyS.size,
        }}
      >
        {isLoading ? "..." : "Add"}
      </button>
    </div>
  );
}
