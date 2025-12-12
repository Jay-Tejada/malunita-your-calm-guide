import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, FolderOpen, MoreHorizontal, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ProjectCanvasIndex() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  // Fetch all projects
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["canvas-projects"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("canvas_projects")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_archived", false)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Create project mutation
  const createProject = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create project
      const { data: project, error: projectError } = await supabase
        .from("canvas_projects")
        .insert({ name, user_id: user.id })
        .select()
        .single();
      if (projectError) throw projectError;

      // Create initial page
      const { data: page, error: pageError } = await supabase
        .from("project_pages")
        .insert({
          project_id: project.id,
          user_id: user.id,
          title: "Getting Started",
          sort_order: 0,
        })
        .select()
        .single();
      if (pageError) throw pageError;

      // Create initial welcome block
      await supabase.from("page_blocks").insert({
        page_id: page.id,
        user_id: user.id,
        block_type: "header",
        content: { text: "Welcome to your new project", level: 1 },
        sort_order: 0,
      });

      await supabase.from("page_blocks").insert({
        page_id: page.id,
        user_id: user.id,
        block_type: "text",
        content: { text: "Start writing here. This is your calm thinking space." },
        sort_order: 1,
      });

      return project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["canvas-projects"] });
      navigate(`/canvas/${project.id}`);
      toast.success("Project created");
      setCreateDialogOpen(false);
      setNewProjectName("");
    },
    onError: () => {
      toast.error("Failed to create project");
    },
  });

  // Delete project mutation
  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("canvas_projects")
        .update({ is_archived: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas-projects"] });
      toast.success("Project archived");
    },
  });

  const handleCreate = () => {
    if (!newProjectName.trim()) return;
    createProject.mutate(newProjectName.trim());
  };

  // Update document title
  useEffect(() => {
    document.title = "Project Canvas - Malunita";
  }, []);

  return (
    <div className="min-h-screen bg-canvas-bg p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-canvas-text-muted hover:text-canvas-text font-mono text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Malunita
          </button>
          <h1 className="font-mono text-2xl text-canvas-text font-medium mb-2">
            Project Canvas
          </h1>
          <p className="text-canvas-text-muted font-mono text-sm">
            Zero Noise Thinking Space
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Create New Project Card */}
          <button
            onClick={() => setCreateDialogOpen(true)}
            className="group flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed border-canvas-border hover:border-canvas-accent hover:bg-canvas-sidebar transition-all duration-200 min-h-[160px]"
          >
            <Plus className="w-8 h-8 text-canvas-text-muted group-hover:text-canvas-accent mb-3 transition-colors" />
            <span className="font-mono text-sm text-canvas-text-muted group-hover:text-canvas-accent transition-colors">
              New Project
            </span>
          </button>

          {/* Existing Projects */}
          {projects.map((project) => (
            <div
              key={project.id}
              className="group relative flex flex-col p-5 rounded-lg border border-canvas-border bg-canvas-sidebar hover:border-canvas-accent transition-all duration-200 cursor-pointer min-h-[160px]"
              onClick={() => navigate(`/canvas/${project.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                  style={{ backgroundColor: project.color || "#D4A574" }}
                >
                  {project.icon || "📁"}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProject.mutate(project.id);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <h3 className="font-mono text-base text-canvas-text font-medium mb-1 line-clamp-2">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-sm text-canvas-text-muted line-clamp-2 mb-auto">
                  {project.description}
                </p>
              )}
              <p className="font-mono text-xs text-canvas-text-muted mt-3">
                {format(new Date(project.updated_at), "MMM d, yyyy")}
              </p>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {!isLoading && projects.length === 0 && (
          <div className="text-center py-16">
            <FolderOpen className="w-12 h-12 text-canvas-text-muted mx-auto mb-4" />
            <p className="font-mono text-canvas-text-muted">
              No projects yet. Create your first one.
            </p>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-canvas-sidebar border-canvas-border">
          <DialogHeader>
            <DialogTitle className="font-mono text-canvas-text">
              New Project
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Project name..."
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="bg-canvas-bg border-canvas-border text-canvas-text"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCreateDialogOpen(false)}
              className="text-canvas-text-muted"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newProjectName.trim()}
              className="bg-canvas-accent text-canvas-bg hover:bg-canvas-accent/90"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
