import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { HomeCanvas } from "@/components/home/HomeCanvas";
import { CompanionSidebar } from "@/components/companion/CompanionSidebar";

interface HomeShellProps {
  children?: React.ReactNode;
  onSettingsClick: () => void;
  onCategoryClick: (category: string) => void;
  onFocusModeClick?: () => void;
  onWorldMapClick?: () => void;
  onShareMalunitaClick?: () => void;
  onDreamModeClick?: () => void;
  activeCategory: string | null;
}



export function HomeShell({
  children,
  onSettingsClick,
  onCategoryClick,
  onFocusModeClick,
  onWorldMapClick,
  onShareMalunitaClick,
  onDreamModeClick,
  activeCategory,
}: HomeShellProps) {
  const isMobile = useIsMobile();
  const [companionSheetOpen, setCompanionSheetOpen] = useState(false);

  if (isMobile) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex flex-col w-full">
          {/* Mobile Header with Menu Trigger */}
          <header className="h-14 flex items-center border-b border-border bg-sidebar-bg px-4">
            <SidebarTrigger className="mr-2" />
            <h1 className="text-lg font-medium tracking-tight text-foreground font-mono">
              malunita
            </h1>
          </header>

          {/* Collapsible Sidebar */}
          <div className="flex flex-1 w-full">
            <AppSidebar
              onSettingsClick={onSettingsClick}
              onCategoryClick={onCategoryClick}
              onFocusModeClick={onFocusModeClick}
              onWorldMapClick={onWorldMapClick}
              onShareMalunitaClick={onShareMalunitaClick}
              onDreamModeClick={onDreamModeClick}
              activeCategory={activeCategory}
            />

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
              <HomeCanvas>{children}</HomeCanvas>
            </main>
          </div>

          {/* Companion Bottom Sheet */}
          <Sheet open={companionSheetOpen} onOpenChange={setCompanionSheetOpen}>
            <SheetTrigger asChild>
              <button className="fixed bottom-4 right-4 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center">
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[60vh]">
              <CompanionSidebar />
            </SheetContent>
          </Sheet>
        </div>
      </SidebarProvider>
    );
  }

  // Desktop Layout - CSS Grid
  return (
    <SidebarProvider>
      <div
        className="min-h-screen w-full"
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr 340px",
        }}
      >
        {/* Left Sidebar */}
        <AppSidebar
          onSettingsClick={onSettingsClick}
          onCategoryClick={onCategoryClick}
          onFocusModeClick={onFocusModeClick}
          onWorldMapClick={onWorldMapClick}
          onShareMalunitaClick={onShareMalunitaClick}
          onDreamModeClick={onDreamModeClick}
          activeCategory={activeCategory}
        />

        {/* Center Canvas */}
        <main className="overflow-auto">
          <HomeCanvas>{children}</HomeCanvas>
        </main>

        {/* Right Companion Sidebar */}
        <CompanionSidebar />
      </div>
    </SidebarProvider>
  );
}
