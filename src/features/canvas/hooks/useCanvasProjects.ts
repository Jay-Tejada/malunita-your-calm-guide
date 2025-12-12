import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CanvasProject } from '../types';
import { useToast } from '@/hooks/use-toast';

export const useCanvasProjects = () => {
  const [projects, setProjects] = useState<CanvasProject[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProjects([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('canvas_projects')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects((data as CanvasProject[]) || []);
    } catch (err) {
      console.error('Error fetching canvas projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const createProject = async (name: string, icon = '📁', color = '#6366f1') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('canvas_projects')
        .insert({
          user_id: user.id,
          name,
          icon,
          color
        })
        .select()
        .single();

      if (error) throw error;

      // Create a default page
      await supabase
        .from('project_pages')
        .insert({
          project_id: data.id,
          user_id: user.id,
          title: 'Getting Started',
          page_type: 'canvas',
          icon: '📄'
        });

      setProjects(prev => [data as CanvasProject, ...prev]);
      toast({ title: 'Project created', description: name });
      return data as CanvasProject;
    } catch (err) {
      console.error('Error creating project:', err);
      toast({ title: 'Failed to create project', variant: 'destructive' });
      return null;
    }
  };

  const updateProject = async (id: string, updates: Partial<CanvasProject>) => {
    try {
      const { error } = await supabase
        .from('canvas_projects')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      return true;
    } catch (err) {
      console.error('Error updating project:', err);
      return false;
    }
  };

  const archiveProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('canvas_projects')
        .update({ is_archived: true })
        .eq('id', id);

      if (error) throw error;
      setProjects(prev => prev.filter(p => p.id !== id));
      toast({ title: 'Project archived' });
      return true;
    } catch (err) {
      console.error('Error archiving project:', err);
      return false;
    }
  };

  return {
    projects,
    loading,
    createProject,
    updateProject,
    archiveProject,
    refetch: fetchProjects
  };
};
