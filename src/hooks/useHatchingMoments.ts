import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HatchingMoment {
  id: string;
  user_id: string;
  stage_reached: number;
  captured_at: string;
  image_path: string;
  personality_type: string | null;
  companion_name: string | null;
  created_at: string;
}

export const useHatchingMoments = () => {
  const [moments, setMoments] = useState<HatchingMoment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchMoments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('hatching_moments')
        .select('*')
        .eq('user_id', user.id)
        .order('captured_at', { ascending: false });

      if (error) throw error;
      setMoments(data || []);
    } catch (error) {
      console.error('Error fetching hatching moments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMoments();
  }, []);

  const captureHatchingMoment = async (
    imageBlob: Blob,
    stageReached: number,
    personalityType: string,
    companionName: string | null
  ): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to save your hatching moment',
          variant: 'destructive',
        });
        return null;
      }

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${user.id}/hatching-stage-${stageReached}-${timestamp}.png`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('hatching-moments')
        .upload(filename, imageBlob, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Save to database
      const { error: dbError } = await supabase
        .from('hatching_moments')
        .insert({
          user_id: user.id,
          stage_reached: stageReached,
          image_path: filename,
          personality_type: personalityType,
          companion_name: companionName,
        });

      if (dbError) throw dbError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('hatching-moments')
        .getPublicUrl(filename);

      await fetchMoments();

      toast({
        title: '📸 Hatching moment captured!',
        description: 'Your special moment has been saved to memories',
        duration: 5000,
      });

      return publicUrl;
    } catch (error) {
      console.error('Error capturing hatching moment:', error);
      toast({
        title: 'Failed to save moment',
        description: 'Could not save your hatching photo',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteMoment = async (momentId: string, imagePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('hatching-moments')
        .remove([imagePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('hatching_moments')
        .delete()
        .eq('id', momentId);

      if (dbError) throw dbError;

      await fetchMoments();

      toast({
        title: 'Moment deleted',
        description: 'Hatching photo removed from memories',
      });
    } catch (error) {
      console.error('Error deleting moment:', error);
      toast({
        title: 'Failed to delete',
        description: 'Could not remove hatching photo',
        variant: 'destructive',
      });
    }
  };

  const getImageUrl = (imagePath: string): string => {
    const { data: { publicUrl } } = supabase.storage
      .from('hatching-moments')
      .getPublicUrl(imagePath);
    return publicUrl;
  };

  const shareHatchingMoment = async (imageUrl: string, companionName: string | null) => {
    const name = companionName || 'My companion';
    
    if (navigator.share) {
      try {
        // Fetch the image as a blob for native sharing
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'hatching-moment.png', { type: 'image/png' });

        await navigator.share({
          title: `${name} hatched!`,
          text: `Check out my companion's hatching moment! 🥚✨`,
          files: [file],
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
          fallbackShare(imageUrl);
        }
      }
    } else {
      fallbackShare(imageUrl);
    }
  };

  const fallbackShare = (imageUrl: string) => {
    // Copy link to clipboard
    navigator.clipboard.writeText(imageUrl);
    toast({
      title: 'Link copied!',
      description: 'Image URL copied to clipboard',
    });
  };

  const downloadHatchingMoment = async (imageUrl: string, companionName: string | null) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${companionName || 'companion'}-hatching-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Download started',
        description: 'Your hatching moment is being saved',
      });
    } catch (error) {
      console.error('Error downloading:', error);
      toast({
        title: 'Download failed',
        description: 'Could not download the image',
        variant: 'destructive',
      });
    }
  };

  return {
    moments,
    isLoading,
    captureHatchingMoment,
    deleteMoment,
    getImageUrl,
    shareHatchingMoment,
    downloadHatchingMoment,
    refetch: fetchMoments,
  };
};
