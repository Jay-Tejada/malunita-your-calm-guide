import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { ImageLightbox } from "./ImageLightbox";

interface UploadingImage {
  id: string;
  preview: string;
  progress: number;
}

interface ImageGridProps {
  images: string[];
  uploadingImages: UploadingImage[];
  onRemove?: (url: string) => void;
  editable?: boolean;
}

export const ImageGrid = ({ images, uploadingImages, onRemove, editable = false }: ImageGridProps) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const allImages = [
    ...uploadingImages.map((u) => ({ type: "uploading" as const, ...u })),
    ...images.map((url) => ({ type: "uploaded" as const, url })),
  ];

  if (allImages.length === 0) return null;

  return (
    <>
      <div className={`grid gap-3 ${
        allImages.length === 1 ? "grid-cols-1" : "grid-cols-2"
      }`}>
        {allImages.map((img, index) => (
          <div
            key={img.type === "uploading" ? img.id : img.url}
            className="relative group"
          >
            <img
              src={img.type === "uploading" ? img.preview : img.url}
              alt=""
              className={`w-full h-auto max-h-[400px] object-contain rounded-lg cursor-pointer transition-opacity bg-foreground/5 ${
                img.type === "uploading" ? "opacity-60" : "hover:opacity-90"
              }`}
              onClick={() => {
                if (img.type === "uploaded") {
                  const uploadedIndex = images.indexOf(img.url);
                  setLightboxIndex(uploadedIndex);
                }
              }}
            />

            {/* Upload progress overlay */}
            {img.type === "uploading" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 text-text-primary animate-spin" />
                  <div className="w-16 h-1 bg-bg-surface-2/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent-color transition-all duration-300"
                      style={{ width: `${img.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Remove button */}
            {editable && img.type === "uploaded" && onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(img.url);
                }}
                className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-text-primary/80 hover:text-text-primary hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
};
