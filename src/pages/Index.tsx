import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Auth } from "@/components/Auth";
import { GlobeButton } from "@/components/GlobeButton";
import { LeftDrawer } from "@/components/LeftDrawer";
import { HomeOrb } from "@/components/HomeOrb";
import { CenterContentContainer } from "@/components/CenterContentContainer";
import { DailyIntelligence } from "@/components/DailyIntelligence";
import { TaskList } from "@/components/TaskList";
import { CompanionOnboarding } from "@/components/CompanionOnboarding";
import { useTasks } from "@/hooks/useTasks";
import { useProfile } from "@/hooks/useProfile";
import { useCompanionIdentity, PersonalityType } from "@/hooks/useCompanionIdentity";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeView, setActiveView] = useState<string>("home");
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { tasks } = useTasks();
  const { companion, needsOnboarding, updateCompanion } = useCompanionIdentity();
  const { toast } = useToast();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleCompanionComplete = async (name: string, personality: PersonalityType) => {
    const colorwayMap = {
      zen: 'zen-default',
      spark: 'spark-default',
      cosmo: 'cosmo-default',
    };

    await updateCompanion({
      name,
      personalityType: personality,
      colorway: colorwayMap[personality],
    });

    toast({
      title: `Welcome, ${name}!`,
      description: `Your ${personality} companion is ready to help you.`,
    });
  };

  const handleSelectView = (view: string) => {
    setActiveView(view);
    setDrawerOpen(false);

    // Handle navigation for specific views
    const navigationMap: Record<string, string> = {
      inbox: "/inbox",
      goals: "/goals",
      insights: "/weekly-insights",
      clusters: "/clusters",
      journal: "/journal",
      companion: "/customization",
      settings: "/notifications",
    };

    if (navigationMap[view]) {
      navigate(navigationMap[view]);
    }
  };

  const handleReturnHome = () => {
    setActiveView("home");
    setDrawerOpen(false);
  };

  const renderContent = () => {
    switch (activeView) {
      case "home":
        return <HomeOrb onCapture={() => setActiveView("today")} />;
      
      case "today":
        return (
          <CenterContentContainer>
            <DailyIntelligence 
              topPriorities={tasks?.filter(t => t.is_focus && !t.completed).slice(0, 3) || []}
              followUps={[]}
              quickWins={tasks?.filter(t => !t.completed).slice(0, 3) || []}
            />
            <div className="mt-8">
              <TaskList category="today" />
            </div>
          </CenterContentContainer>
        );
      
      case "upcoming":
        return (
          <CenterContentContainer>
            <h2 className="text-2xl font-mono mb-6">Upcoming Tasks</h2>
            <TaskList category="upcoming" />
          </CenterContentContainer>
        );
      
      case "work":
      case "home":
      case "gym":
        return (
          <CenterContentContainer>
            <h2 className="text-2xl font-mono mb-6 capitalize">{activeView}</h2>
            <TaskList category={activeView} />
          </CenterContentContainer>
        );
      
      default:
        return <HomeOrb onCapture={() => setActiveView("today")} />;
    }
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

  if (needsOnboarding) {
    return <CompanionOnboarding open={true} onComplete={handleCompanionComplete} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top-Left Globe - Menu */}
      <GlobeButton
        position="top-left"
        variant="menu"
        onClick={() => setDrawerOpen(!drawerOpen)}
        isActive={drawerOpen}
      />

      {/* Top-Right Globe - Return Home */}
      <GlobeButton
        position="top-right"
        variant="home"
        onClick={handleReturnHome}
        isActive={activeView !== "home"}
      />

      {/* Left Navigation Drawer */}
      <LeftDrawer
        isOpen={drawerOpen}
        activeView={activeView}
        onSelectView={handleSelectView}
      />

      {/* Main Content Area */}
      <div className="min-h-screen flex items-center justify-center">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
