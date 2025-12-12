import { cn } from "@/lib/utils";

interface Block {
  id: string;
  block_type: string;
  content: any;
  sort_order: number | null;
}

interface CanvasTableOfContentsProps {
  blocks: Block[];
  activeSection: string | null;
}

export function CanvasTableOfContents({
  blocks,
  activeSection,
}: CanvasTableOfContentsProps) {
  // Filter only header blocks
  const headers = blocks.filter(
    (b) => b.block_type === "header" && b.content?.text
  );

  const scrollToBlock = (id: string) => {
    const el = document.getElementById(`block-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (headers.length === 0) {
    return (
      <div className="h-full p-4">
        <h3 className="font-mono text-xs text-canvas-text-muted uppercase tracking-wider mb-4">
          On this page
        </h3>
        <p className="text-sm text-canvas-text-muted/60 font-mono">
          Add headings to see table of contents
        </p>
      </div>
    );
  }

  return (
    <div className="h-full p-4 sticky top-0">
      <h3 className="font-mono text-xs text-canvas-text-muted uppercase tracking-wider mb-4">
        On this page
      </h3>
      <nav className="space-y-1">
        {headers.map((header) => {
          const level = header.content?.level || 1;
          const isActive = activeSection === header.id;

          return (
            <button
              key={header.id}
              onClick={() => scrollToBlock(header.id)}
              className={cn(
                "block w-full text-left text-sm font-mono truncate py-1 transition-colors",
                level === 2 && "pl-3",
                isActive
                  ? "text-canvas-accent font-medium"
                  : "text-canvas-text-muted hover:text-canvas-text"
              )}
            >
              {header.content?.text || "Untitled"}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
