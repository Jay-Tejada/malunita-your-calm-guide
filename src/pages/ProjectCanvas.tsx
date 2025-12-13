import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CanvasOutlineSidebar } from "@/features/canvas/CanvasOutlineSidebar";
import { CanvasDocument } from "@/features/canvas/CanvasDocument";
import { CanvasTableOfContents } from "@/features/canvas/CanvasTableOfContents";
import { CanvasTopBar } from "@/features/canvas/CanvasTopBar";
import { cn } from "@/lib/utils";

export default function ProjectCanvas() {
  const { projectId, pageId } = useParams();
  const navigate = useNavigate();
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Fetch project
  const { data: project } = useQuery({
    queryKey: ["canvas-project", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from("canvas_projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch pages for this project
  const { data: pages = [] } = useQuery({
    queryKey: ["canvas-pages", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("project_pages")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Get current page
  const currentPage = pages.find((p) => p.id === pageId) || pages[0];

  // Fetch blocks for current page
  const { data: blocks = [] } = useQuery({
    queryKey: ["canvas-blocks", currentPage?.id],
    queryFn: async () => {
      if (!currentPage?.id) return [];
      const { data, error } = await supabase
        .from("page_blocks")
        .select("*")
        .eq("page_id", currentPage.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!currentPage?.id,
  });

  // Navigate to first page if none selected
  useEffect(() => {
    if (projectId && pages.length > 0 && !pageId) {
      navigate(`/canvas/${projectId}/${pages[0].id}`, { replace: true });
    }
  }, [projectId, pages, pageId, navigate]);

  // Handle mobile sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setLeftSidebarOpen(false);
        setRightSidebarOpen(false);
      } else {
        setLeftSidebarOpen(true);
        setRightSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Keyboard shortcut: H to go home
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }
      
      if (e.key.toLowerCase() === "h" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        navigate("/");
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  // Update document title
  useEffect(() => {
    document.title = `${project?.name || "Project Canvas"} - Malunita`;
  }, [project?.name]);

  return (
    <div className="h-screen flex flex-col bg-canvas-bg overflow-hidden">
      {/* Top Bar */}
      <CanvasTopBar
        projectName={project?.name || "Untitled Project"}
        pageName={currentPage?.title}
        onToggleLeftSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
        onToggleRightSidebar={() => setRightSidebarOpen(!rightSidebarOpen)}
        leftSidebarOpen={leftSidebarOpen}
        rightSidebarOpen={rightSidebarOpen}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Outline */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out border-r border-canvas-border bg-canvas-sidebar flex-shrink-0",
            leftSidebarOpen ? "w-64" : "w-0"
          )}
        >
          {leftSidebarOpen && (
            <CanvasOutlineSidebar
              projectId={projectId || ""}
              pages={pages}
              currentPageId={currentPage?.id}
              onPageSelect={(id) => navigate(`/canvas/${projectId}/${id}`)}
            />
          )}
        </div>

        {/* Main Document Canvas */}
        <div className="flex-1 overflow-y-auto">
          <CanvasDocument
            page={currentPage}
            blocks={blocks}
            onSectionChange={setActiveSection}
          />
        </div>

        {/* Right Sidebar - Table of Contents */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out border-l border-canvas-border bg-canvas-sidebar flex-shrink-0",
            rightSidebarOpen ? "w-52" : "w-0"
          )}
        >
          {rightSidebarOpen && (
            <CanvasTableOfContents
              blocks={blocks}
              activeSection={activeSection}
            />
          )}
        </div>
      </div>
    </div>
  );
}
