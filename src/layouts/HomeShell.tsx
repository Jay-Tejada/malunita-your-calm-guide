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
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/10">
      {children}
    </div>
  );
}
