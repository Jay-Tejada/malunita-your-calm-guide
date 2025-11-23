import { motion, AnimatePresence } from "framer-motion";
import { Plus, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeftDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const LeftDrawer = ({ isOpen, onClose, onNavigate }: LeftDrawerProps) => {
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/10 backdrop-blur-[14px] z-40"
              onClick={onClose}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={cn(
                "fixed left-0 top-0 bottom-0 z-50",
                "w-full md:w-[380px]",
                "overflow-y-auto",
                "bg-background shadow-lg"
              )}
            >
              <div className="h-full flex flex-col p-6 md:p-8 pt-16">
                {/* Prompt Card */}
                <div className="w-full rounded-xl bg-gradient-to-b from-muted/50 to-muted/30 p-4 flex items-center gap-3 mb-5">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 flex-shrink-0" />
                  <p className="font-mono text-[15px] text-foreground/90">
                    What matters most today?
                  </p>
                </div>

                {/* Add New Task Button */}
                <button
                  onClick={() => {
                    onNavigate("/");
                    onClose();
                  }}
                  className="w-full h-14 rounded-full bg-[#111111] hover:bg-[#1a1a1a] text-white font-mono text-[15px] flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 mb-5"
                >
                  <Plus className="w-4 h-4" />
                  Add new task
                </button>

                {/* View All Tasks Button */}
                <button
                  onClick={() => {
                    onNavigate("/");
                    onClose();
                  }}
                  className="w-full h-14 rounded-full bg-transparent border border-border hover:border-foreground/30 hover:bg-muted/20 text-foreground font-mono text-[15px] flex items-center justify-center gap-2 transition-all"
                >
                  <ListTodo className="w-4 h-4" />
                  View All Tasks
                </button>

                {/* Empty space for future content */}
                <div className="flex-1 mt-8" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
