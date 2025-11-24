interface HomeCanvasProps {
  children?: React.ReactNode;
}

export function HomeCanvas({ children }: HomeCanvasProps) {
  return (
    <div className="min-h-screen w-full relative">
      {children}
    </div>
  );
}


