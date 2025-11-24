import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GuidanceBillboardProps {
  message: string;
}

export function GuidanceBillboard({ message }: GuidanceBillboardProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-hide after 4 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-full px-4"
        >
          <div
            style={{
              backgroundColor: "#F8F4EC",
              color: "#3D3325",
              borderRadius: "16px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
            }}
            className="px-6 py-4 text-center"
          >
            <p className="text-sm font-medium">{message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
