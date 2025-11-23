import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Auth } from "@/components/Auth";
import { GlobeButton } from "@/components/GlobeButton";
import { LeftDrawer } from "@/components/LeftDrawer";
import { RightDrawer } from "@/components/RightDrawer";
import { HomeOrb } from "@/components/HomeOrb";
import { CompanionOnboarding } from "@/components/CompanionOnboarding";
import { useProfile } from "@/hooks/useProfile";
import { useCompanionIdentity, PersonalityType } from "@/hooks/useCompanionIdentity";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const { profile } = useProfile();
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
      {/* Top-Left Planet - Tasks Drawer */}
      <GlobeButton
        position="top-left"
        variant="menu"
        onClick={() => setLeftDrawerOpen(!leftDrawerOpen)}
        isActive={leftDrawerOpen}
      />

      {/* Top-Right Planet - Companion Drawer */}
      <GlobeButton
        position="top-right"
        variant="home"
        onClick={() => setRightDrawerOpen(!rightDrawerOpen)}
        isActive={rightDrawerOpen}
      />

      {/* Left Tasks Drawer */}
      <LeftDrawer
        isOpen={leftDrawerOpen}
        onClose={() => setLeftDrawerOpen(false)}
        onNavigate={(path) => navigate(path)}
      />

      {/* Right Companion Drawer */}
      <RightDrawer
        isOpen={rightDrawerOpen}
        onClose={() => setRightDrawerOpen(false)}
      />

      {/* Main Content - Always Show Orb */}
      <HomeOrb />
    </div>
  );
};

export default Index;
