import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProjectPage } from '../types';
import { useToast } from '@/hooks/use-toast';

export const useProjectPages = (projectId: string | undefined) => {
  const [pages, setPages] = useState<ProjectPage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const buildPageTree = (flatPages: ProjectPage[]): ProjectPage[] => {
    const pageMap = new Map<string, ProjectPage>();
    const roots: ProjectPage[] = [];

    flatPages.forEach(page => {
      pageMap.set(page.id, { ...page, children: [] });
    });

    flatPages.forEach(page => {
      const node = pageMap.get(page.id)!;
      if (page.parent_page_id) {
        const parent = pageMap.get(page.parent_page_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    const sortPages = (pages: ProjectPage[]): ProjectPage[] => {
      return pages
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(p => ({ ...p, children: p.children ? sortPages(p.children) : [] }));
    };

    return sortPages(roots);
  };

  const fetchPages = useCallback(async () => {
    if (!projectId) {
      setPages([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('project_pages')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      const tree = buildPageTree((data as ProjectPage[]) || []);
      setPages(tree);
    } catch (err) {
      console.error('Error fetching pages:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const createPage = async (
    title: string,
    pageType: ProjectPage['page_type'] = 'canvas',
    parentPageId?: string
  ) => {
    if (!projectId) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('project_pages')
        .insert({
          project_id: projectId,
          user_id: user.id,
          title,
          page_type: pageType,
          parent_page_id: parentPageId,
          icon: pageType === 'idea_board' ? '💡' : pageType === 'gallery' ? '🖼️' : pageType === 'structured_doc' ? '📝' : '📄'
        })
        .select()
        .single();

      if (error) throw error;
      await fetchPages();
      return data as ProjectPage;
    } catch (err) {
      console.error('Error creating page:', err);
      toast({ title: 'Failed to create page', variant: 'destructive' });
      return null;
    }
  };

  const updatePage = async (id: string, updates: Partial<ProjectPage>) => {
    try {
      const { error } = await supabase
        .from('project_pages')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchPages();
      return true;
    } catch (err) {
      console.error('Error updating page:', err);
      return false;
    }
  };

  const deletePage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('project_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchPages();
      toast({ title: 'Page deleted' });
      return true;
    } catch (err) {
      console.error('Error deleting page:', err);
      return false;
    }
  };

  const reorderPages = async (pageIds: string[]) => {
    try {
      await Promise.all(
        pageIds.map((id, index) =>
          supabase.from('project_pages').update({ sort_order: index }).eq('id', id)
        )
      );
      await fetchPages();
    } catch (err) {
      console.error('Error reordering pages:', err);
    }
  };

  return {
    pages,
    loading,
    createPage,
    updatePage,
    deletePage,
    reorderPages,
    refetch: fetchPages
  };
};
