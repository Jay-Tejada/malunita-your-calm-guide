import { motion } from "framer-motion";
import { ReactNode } from "react";

interface CenterContentContainerProps {
  children: ReactNode;
}

export const CenterContentContainer = ({ children }: CenterContentContainerProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="w-full max-w-4xl mx-auto px-6 py-8"
    >
      {children}
    </motion.div>
  );
};
