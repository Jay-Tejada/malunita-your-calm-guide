import { CompanionSidebar } from "@/components/companion/CompanionSidebar";
import { useCompanionVisibility } from "@/state/useCompanionVisibility";

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
  const { isVisible } = useCompanionVisibility();

  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-background via-background to-muted/10">
      {/* Main Content Area */}
      <div className="flex-1 relative">
        {children}
      </div>
      
      {/* Right Companion Sidebar - HIDDEN until companion feature is ready */}
      {/* {isVisible && (
        <aside className="hidden lg:block w-80 border-l border-border/20 bg-sidebar">
          <CompanionSidebar />
        </aside>
      )} */}
    </div>
  );
}
