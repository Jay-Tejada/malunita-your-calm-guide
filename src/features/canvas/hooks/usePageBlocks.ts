import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PageBlock, BlockType, BlockContent } from '../types';

export const usePageBlocks = (pageId: string | undefined) => {
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlocks = useCallback(async () => {
    if (!pageId) {
      setBlocks([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('page_blocks')
        .select('*')
        .eq('page_id', pageId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setBlocks((data as PageBlock[]) || []);
    } catch (err) {
      console.error('Error fetching blocks:', err);
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const createBlock = async (
    blockType: BlockType = 'text',
    content: BlockContent = {},
    afterBlockId?: string
  ) => {
    if (!pageId) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Calculate sort order
      let sortOrder = 0;
      if (afterBlockId) {
        const afterBlock = blocks.find(b => b.id === afterBlockId);
        if (afterBlock) {
          sortOrder = afterBlock.sort_order + 1;
          // Shift subsequent blocks
          await Promise.all(
            blocks
              .filter(b => b.sort_order > afterBlock.sort_order)
              .map(b => 
                supabase
                  .from('page_blocks')
                  .update({ sort_order: b.sort_order + 1 })
                  .eq('id', b.id)
              )
          );
        }
      } else {
        sortOrder = blocks.length > 0 ? Math.max(...blocks.map(b => b.sort_order)) + 1 : 0;
      }

      const { data, error } = await supabase
        .from('page_blocks')
        .insert({
          page_id: pageId,
          user_id: user.id,
          block_type: blockType,
          content: content as unknown as Record<string, unknown>,
          sort_order: sortOrder
        })
        .select()
        .single();

      if (error) throw error;
      await fetchBlocks();
      return data as PageBlock;
    } catch (err) {
      console.error('Error creating block:', err);
      return null;
    }
  };

  const updateBlock = async (id: string, updates: Partial<PageBlock>) => {
    try {
      const dbUpdates = { ...updates } as Record<string, unknown>;
      if (updates.content) {
        dbUpdates.content = updates.content as unknown as Record<string, unknown>;
      }
      const { error } = await supabase
        .from('page_blocks')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
      setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
      return true;
    } catch (err) {
      console.error('Error updating block:', err);
      return false;
    }
  };

  const deleteBlock = async (id: string) => {
    try {
      const { error } = await supabase
        .from('page_blocks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setBlocks(prev => prev.filter(b => b.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting block:', err);
      return false;
    }
  };

  const reorderBlocks = async (blockIds: string[]) => {
    try {
      const reordered = blockIds
        .map((id, index) => {
          const block = blocks.find(b => b.id === id);
          return block ? { ...block, sort_order: index } : null;
        })
        .filter((b): b is PageBlock => b !== null);

      setBlocks(reordered);

      await Promise.all(
        blockIds.map((id, index) =>
          supabase.from('page_blocks').update({ sort_order: index }).eq('id', id)
        )
      );
    } catch (err) {
      console.error('Error reordering blocks:', err);
    }
  };

  return {
    blocks,
    loading,
    createBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    refetch: fetchBlocks
  };
};
