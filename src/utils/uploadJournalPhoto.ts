import { supabase } from '@/integrations/supabase/client';

export const uploadJournalPhoto = async (
  file: File,
  userId: string
): Promise<string | null> => {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload to Supabase storage
    const { error } = await supabase.storage
      .from('journal-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('journal-photos')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (err) {
    console.error('Upload failed:', err);
    return null;
  }
};

export const deleteJournalPhoto = async (photoUrl: string): Promise<boolean> => {
  try {
    // Extract path from URL
    const path = photoUrl.split('/journal-photos/')[1];
    if (!path) return false;

    const { error } = await supabase.storage
      .from('journal-photos')
      .remove([path]);

    return !error;
  } catch (err) {
    console.error('Delete failed:', err);
    return false;
  }
};
