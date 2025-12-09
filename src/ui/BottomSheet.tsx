// src/ui/BottomSheet.tsx

import { motion, AnimatePresence } from "framer-motion";
import { colors, typography, layout } from "@/ui/tokens";

interface BottomSheetProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({
  isOpen,
  title,
  description,
  onClose,
  children,
}: BottomSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto"
            style={{
              backgroundColor: colors.bg.surface,
              borderTopLeftRadius: layout.radius.lg,
              borderTopRightRadius: layout.radius.lg,
              paddingBottom: "env(safe-area-inset-bottom, 20px)",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: layout.radius.pill,
                  backgroundColor: colors.border.strong,
                }}
              />
            </div>

            {/* Header */}
            {(title || description) && (
              <div className="px-5 pb-4">
                {title && (
                  <h2
                    style={{
                      fontFamily: typography.fontFamily,
                      fontSize: typography.titleM.size,
                      fontWeight: typography.titleM.weight,
                      color: colors.text.primary,
                    }}
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    style={{
                      fontFamily: typography.fontFamily,
                      fontSize: typography.bodyS.size,
                      color: colors.text.secondary,
                      marginTop: 4,
                    }}
                  >
                    {description}
                  </p>
                )}
              </div>
            )}

            {/* Content */}
            <div className="px-5 pb-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
