import React from "react";
import { motion } from "framer-motion";
import { X, User, Palette, Bell, Settings as SettingsIcon, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface SettingsPanelProps {
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "See you soon!",
    });
    navigate("/");
  };

  const settingsItems = [
    { icon: User, label: "Profile", action: () => navigate("/profile") },
    { icon: Palette, label: "Appearance", action: () => {} },
    { icon: Bell, label: "Notifications", action: () => navigate("/notifications") },
    { icon: SettingsIcon, label: "Preferences", action: () => {} },
  ];

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed bottom-0 left-0 right-0 h-[400px] bg-card/95 backdrop-blur-sm border-t border-border/30 shadow-2xl z-50 overflow-y-auto"
    >
      {/* Header */}
      <div className="p-6 border-b border-border/30">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-lg font-medium text-foreground">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground/60" />
          </button>
        </div>
      </div>

      {/* Settings List */}
      <div className="p-6 space-y-2">
        {settingsItems.map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            className="w-full flex items-center gap-4 p-4 hover:bg-muted rounded-lg transition-colors text-left"
          >
            <div className="p-2 bg-muted rounded-lg">
              <item.icon className="w-5 h-5 text-foreground/70" />
            </div>
            <span className="font-mono text-sm text-foreground">{item.label}</span>
          </button>
        ))}

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-4 p-4 hover:bg-destructive/10 rounded-lg transition-colors text-left"
        >
          <div className="p-2 bg-destructive/10 rounded-lg">
            <LogOut className="w-5 h-5 text-destructive" />
          </div>
          <span className="font-mono text-sm text-destructive">Sign Out</span>
        </button>
      </div>
    </motion.div>
  );
};
