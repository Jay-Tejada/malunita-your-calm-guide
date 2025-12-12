import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GalleryItem } from '../types';
import { useToast } from '@/hooks/use-toast';

export const useGallery = (pageId: string | undefined) => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    if (!pageId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('gallery_items')
        .select('*')
        .eq('page_id', pageId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setItems((data as GalleryItem[]) || []);
    } catch (err) {
      console.error('Error fetching gallery items:', err);
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async (imageUrl: string, caption?: string, tags: string[] = []) => {
    if (!pageId) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('gallery_items')
        .insert({
          page_id: pageId,
          user_id: user.id,
          image_url: imageUrl,
          caption,
          tags,
          sort_order: items.length
        })
        .select()
        .single();

      if (error) throw error;
      setItems(prev => [...prev, data as GalleryItem]);
      return data as GalleryItem;
    } catch (err) {
      console.error('Error adding gallery item:', err);
      toast({ title: 'Failed to add image', variant: 'destructive' });
      return null;
    }
  };

  const updateItem = async (id: string, updates: Partial<GalleryItem>) => {
    try {
      const dbUpdates = { ...updates } as Record<string, unknown>;
      if (updates.metadata) {
        dbUpdates.metadata = updates.metadata as unknown as Record<string, unknown>;
      }
      const { error } = await supabase
        .from('gallery_items')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
      setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
      return true;
    } catch (err) {
      console.error('Error updating gallery item:', err);
      return false;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('gallery_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setItems(prev => prev.filter(i => i.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting gallery item:', err);
      return false;
    }
  };

  const reorderItems = async (itemIds: string[]) => {
    try {
      const reordered = itemIds
        .map((id, index) => {
          const item = items.find(i => i.id === id);
          return item ? { ...item, sort_order: index } : null;
        })
        .filter((i): i is GalleryItem => i !== null);

      setItems(reordered);

      await Promise.all(
        itemIds.map((id, index) =>
          supabase.from('gallery_items').update({ sort_order: index }).eq('id', id)
        )
      );
    } catch (err) {
      console.error('Error reordering gallery items:', err);
    }
  };

  return {
    items,
    loading,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
    refetch: fetchItems
  };
};
