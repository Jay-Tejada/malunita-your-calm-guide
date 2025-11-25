interface HomeCanvasProps {
  children?: React.ReactNode;
}

export function HomeCanvas({ children }: HomeCanvasProps) {
  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center">
      {/* Clean minimal home - just the orb and simple text */}
      <div className="flex flex-col items-center justify-center gap-8">
        <p className="font-mono text-sm text-muted-foreground">
          What's on your mind?
        </p>
        
        {/* Orb */}
        {children}
      </div>
    </div>
  );
}


