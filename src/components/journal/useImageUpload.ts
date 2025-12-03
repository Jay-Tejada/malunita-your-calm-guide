import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UploadingImage {
  id: string;
  preview: string;
  progress: number;
}

export const useImageUpload = (entryId: string | null) => {
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [images, setImages] = useState<string[]>([]);

  const compressImage = async (file: File, maxWidth = 1200): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      img.onload = () => {
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to compress image"));
          },
          "image/jpeg",
          0.85
        );
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const uploadId = crypto.randomUUID();
    const preview = URL.createObjectURL(file);

    // Add to uploading state
    setUploadingImages((prev) => [...prev, { id: uploadId, preview, progress: 0 }]);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Compress the image
      setUploadingImages((prev) =>
        prev.map((img) => (img.id === uploadId ? { ...img, progress: 20 } : img))
      );

      const compressed = await compressImage(file);

      setUploadingImages((prev) =>
        prev.map((img) => (img.id === uploadId ? { ...img, progress: 50 } : img))
      );

      // Generate unique filename
      const ext = "jpg";
      const filename = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("journal-photos")
        .upload(filename, compressed, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setUploadingImages((prev) =>
        prev.map((img) => (img.id === uploadId ? { ...img, progress: 90 } : img))
      );

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("journal-photos")
        .getPublicUrl(filename);

      // Remove from uploading, add to images
      setUploadingImages((prev) => prev.filter((img) => img.id !== uploadId));
      setImages((prev) => [...prev, publicUrl]);

      URL.revokeObjectURL(preview);
      return publicUrl;
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadingImages((prev) => prev.filter((img) => img.id !== uploadId));
      URL.revokeObjectURL(preview);
      return null;
    }
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );
    await Promise.all(imageFiles.map(uploadImage));
  }, []);

  const removeImage = useCallback((url: string) => {
    setImages((prev) => prev.filter((img) => img !== url));
  }, []);

  const reorderImages = useCallback((fromIndex: number, toIndex: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      const [moved] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, moved);
      return newImages;
    });
  }, []);

  const initializeImages = useCallback((existingImages: string[]) => {
    setImages(existingImages);
  }, []);

  const clearImages = useCallback(() => {
    setImages([]);
    setUploadingImages([]);
  }, []);

  return {
    images,
    uploadingImages,
    handleFiles,
    removeImage,
    reorderImages,
    initializeImages,
    clearImages,
    isUploading: uploadingImages.length > 0,
  };
};
