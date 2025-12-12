import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCanvasProjects() {
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading, error } = useQuery({
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas-projects"] });
    },
  });

  return {
    projects,
    isLoading,
    error,
    createProject,
  };
}
