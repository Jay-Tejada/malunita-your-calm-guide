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
      className="flex items-center gap-3"
      style={{
        backgroundColor: colors.bg.elevated,
        borderRadius: layout.radius.md,
        padding: "12px 16px",
        border: `1px solid ${colors.border.subtle}`,
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none"
        style={{
          fontFamily: typography.fontFamily,
          fontSize: typography.bodyM.size,
          color: colors.text.primary,
        }}
        disabled={isLoading}
      />
      <button
        onClick={handleSubmit}
        disabled={!value.trim() || isLoading}
        className="flex-shrink-0 transition-opacity"
        style={{
          opacity: value.trim() ? 1 : 0.4,
          color: colors.accent.primary,
          fontFamily: typography.fontFamily,
          fontSize: typography.bodyS.size,
          fontWeight: 500,
        }}
      >
        {isLoading ? "..." : "Add"}
      </button>
    </div>
  );
}
