import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { IdeaBoardItem, IdeaBoardContent } from '../types';

export const useIdeaBoard = (pageId: string | undefined) => {
  const [items, setItems] = useState<IdeaBoardItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!pageId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('idea_board_items')
        .select('*')
        .eq('page_id', pageId)
        .order('z_index', { ascending: true });

      if (error) throw error;
      setItems((data as IdeaBoardItem[]) || []);
    } catch (err) {
      console.error('Error fetching idea board items:', err);
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const createItem = async (
    itemType: IdeaBoardItem['item_type'],
    content: IdeaBoardContent = {},
    position = { x: 100, y: 100 },
    size = { width: 200, height: 150 },
    color = '#fef3c7'
  ) => {
    if (!pageId) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const maxZ = items.length > 0 ? Math.max(...items.map(i => i.z_index)) : 0;

      const { data, error } = await supabase
        .from('idea_board_items')
        .insert({
          page_id: pageId,
          user_id: user.id,
          item_type: itemType,
          content: content as unknown as Record<string, unknown>,
          position_x: position.x,
          position_y: position.y,
          width: size.width,
          height: size.height,
          color,
          z_index: maxZ + 1
        })
        .select()
        .single();

      if (error) throw error;
      setItems(prev => [...prev, data as IdeaBoardItem]);
      return data as IdeaBoardItem;
    } catch (err) {
      console.error('Error creating item:', err);
      return null;
    }
  };

  const updateItem = async (id: string, updates: Partial<IdeaBoardItem>) => {
    try {
      const dbUpdates = { ...updates } as Record<string, unknown>;
      if (updates.content) {
        dbUpdates.content = updates.content as unknown as Record<string, unknown>;
      }
      const { error } = await supabase
        .from('idea_board_items')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
      setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
      return true;
    } catch (err) {
      console.error('Error updating item:', err);
      return false;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('idea_board_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setItems(prev => prev.filter(i => i.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting item:', err);
      return false;
    }
  };

  const bringToFront = async (id: string) => {
    const maxZ = Math.max(...items.map(i => i.z_index));
    await updateItem(id, { z_index: maxZ + 1 });
  };

  const sendToBack = async (id: string) => {
    const minZ = Math.min(...items.map(i => i.z_index));
    await updateItem(id, { z_index: minZ - 1 });
  };

  return {
    items,
    loading,
    createItem,
    updateItem,
    deleteItem,
    bringToFront,
    sendToBack,
    refetch: fetchItems
  };
};
