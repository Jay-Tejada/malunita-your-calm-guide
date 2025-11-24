import { MindstreamPanel } from "@/components/intelligence/MindstreamPanel";

interface HomeCanvasProps {
  children?: React.ReactNode;
}

export function HomeCanvas({ children }: HomeCanvasProps) {
  return (
    <div className="min-h-screen w-full relative">
      <div className="pt-6">
        <MindstreamPanel />
      </div>
      {children}
    </div>
  );
}


