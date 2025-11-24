interface HomeCanvasProps {
  children?: React.ReactNode;
}

export function HomeCanvas({ children }: HomeCanvasProps) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      {children || (
        <div className="text-muted-foreground text-lg">
          HomeCanvas Loaded
        </div>
      )}
    </div>
  );
}
