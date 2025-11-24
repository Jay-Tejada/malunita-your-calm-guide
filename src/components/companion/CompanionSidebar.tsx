import { useIsMobile } from "@/hooks/use-mobile";

export function CompanionSidebar() {
  const isMobile = useIsMobile();

  // Hidden on mobile
  if (isMobile) {
    return null;
  }

  return (
    <aside 
      className="h-full bg-sidebar-bg border-l border-border flex flex-col"
      style={{ padding: "24px" }}
    >
      <div className="text-muted-foreground">
        Companion Sidebar
      </div>
    </aside>
  );
}
