import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CategoryKeyword {
  id: string;
  user_id: string;
  custom_category_id: string;
  keyword: string;
  created_at: string;
}

export const useCategoryKeywords = (categoryId?: string) => {
  const queryClient = useQueryClient();

  const { data: keywords = [], isLoading } = useQuery({
    queryKey: ['category-keywords', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('category_keywords')
        .select('*')
        .order('created_at', { ascending: false });

      if (categoryId) {
        query = query.eq('custom_category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CategoryKeyword[];
    },
  });

  const addKeyword = useMutation({
    mutationFn: async ({ categoryId, keyword }: { categoryId: string; keyword: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('category_keywords')
        .insert({
          user_id: user.id,
          custom_category_id: categoryId,
          keyword: keyword.toLowerCase().trim(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-keywords'] });
      toast.success('Keyword added');
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('This keyword is already trained for this category');
      } else {
        toast.error('Failed to add keyword');
      }
    },
  });

  const deleteKeyword = useMutation({
    mutationFn: async (keywordId: string) => {
      const { error } = await supabase
        .from('category_keywords')
        .delete()
        .eq('id', keywordId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-keywords'] });
      toast.success('Keyword removed');
    },
    onError: () => {
      toast.error('Failed to remove keyword');
    },
  });

  return {
    keywords,
    isLoading,
    addKeyword: addKeyword.mutateAsync,
    deleteKeyword: deleteKeyword.mutateAsync,
  };
};
