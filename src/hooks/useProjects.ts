import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  space: string;
  color?: string;
  icon?: string;
  is_collapsed: boolean;
  sort_order: number;
  created_at: string;
  archived: boolean;
}

export const useProjects = (space?: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const fetchProjects = async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    let query = supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .eq('archived', false)
      .order('sort_order', { ascending: true });

    if (space) {
      query = query.eq('space', space);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      setProjects((data as Project[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user, space]);

  const createProject = async (project: Omit<Project, 'id' | 'user_id' | 'created_at' | 'is_collapsed' | 'sort_order' | 'archived'>) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: project.name,
        space: project.space,
        color: project.color,
        icon: project.icon,
        sort_order: projects.length
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return null;
    }

    setProjects(prev => [...prev, data as Project]);
    return data as Project;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating project:', error);
      return false;
    }

    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    return true;
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase
      .from('projects')
      .update({ archived: true })
      .eq('id', id);

    if (error) {
      console.error('Error archiving project:', error);
      return false;
    }

    setProjects(prev => prev.filter(p => p.id !== id));
    return true;
  };

  const toggleCollapsed = async (id: string) => {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    await updateProject(id, { is_collapsed: !project.is_collapsed });
  };

  return {
    projects,
    loading,
    createProject,
    updateProject,
    deleteProject,
    toggleCollapsed,
    refetch: fetchProjects
  };
};
