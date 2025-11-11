import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@/components/Auth";
import { MalunitaVoice, MalunitaVoiceRef } from "@/components/MalunitaVoice";
import { TaskList } from "@/components/TaskList";
import { TodaysFocus } from "@/components/TodaysFocus";
import { ProfileSettings } from "@/components/ProfileSettings";
import { RunwayReviewButton } from "@/components/RunwayReviewButton";
import { InstallPromptBanner } from "@/components/InstallPromptBanner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Settings, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const malunitaVoiceRef = useRef<MalunitaVoiceRef>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    // Check current auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Keyboard shortcut for creating new task (Q key)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle Q if not typing in an input
      if (e.key.toLowerCase() === 'q' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        malunitaVoiceRef.current?.startRecording();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleSaveNote = async (text: string, response: string) => {
    // This is now handled in MalunitaVoice component
    // Keeping for backwards compatibility but not actively used
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been signed out successfully.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-3 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (showSettings) {
    return (
      <div className="min-h-screen bg-background py-8">
        <ProfileSettings onClose={() => setShowSettings(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Install Banner */}
      <InstallPromptBanner />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-b border-secondary">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-light tracking-tight text-foreground">Malunita</h1>
            <p className="text-sm text-muted-foreground mt-1">Your minimalist thinking partner</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="pt-24 pb-32 px-6">
        <div className="max-w-4xl mx-auto space-y-16">
          {/* Voice Input */}
          <div className="flex justify-center">
            <MalunitaVoice ref={malunitaVoiceRef} onSaveNote={handleSaveNote} />
          </div>
          
          {/* Today's Focus - Primary */}
          <TodaysFocus />
          
          {/* Secondary Categories - Collapsible */}
          <Collapsible defaultOpen={false} className="border-t border-secondary pt-8">
            <CollapsibleTrigger className="flex items-center justify-between w-full group">
              <h2 className="text-xl font-light text-foreground">Inbox & Categories</h2>
              <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-6">
              <TaskList />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Runway Review Button */}
      <RunwayReviewButton />
    </div>
  );
};

export default Index;
