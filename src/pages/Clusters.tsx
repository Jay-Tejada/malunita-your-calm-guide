import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@/components/Auth";
import { ClusterView } from "@/features/clusters/ClusterView";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AmbientWorld } from "@/features/ambientWorlds/AmbientWorld";
import { useAmbientWorld } from "@/hooks/useAmbientWorld";
import { hapticLight } from "@/utils/haptics";

const Clusters = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { currentWorld } = useAmbientWorld();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden relative">
        <AmbientWorld worldId={currentWorld} />
        
        <div className="flex w-full relative z-10">
          <AppSidebar 
            onSettingsClick={() => {}}
            onCategoryClick={() => {}}
            activeCategory={null}
          />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="border-b bg-background/80 backdrop-blur-sm p-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  hapticLight();
                  navigate('/');
                }}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </header>
            
            <main className="flex-1 overflow-y-auto p-6">
              <div className="container mx-auto max-w-6xl">
                <ClusterView />
              </div>
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Clusters;
