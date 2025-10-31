import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

interface Photo {
  id: string;
  url: string;
  label: string;
}

interface PhotoGalleryViewerProps {
  photos: Photo[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (photoId: string) => void; // Changed from onRetake
  allowDelete?: boolean; // Changed from allowRetake
}

export function PhotoGalleryViewer({ 
  photos, 
  initialIndex = 0, 
  open, 
  onOpenChange,
  onDelete,
  allowDelete = false
}: PhotoGalleryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Reset index when initialIndex or photos change
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, photos]);

  if (!open || !photos || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  const goToPrevious = () => {
    if (hasPrevious) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleDelete = () => {
    if (onDelete && currentPhoto) {
      onDelete(currentPhoto.id);
      // Decide whether to close or move to the next photo
      if (photos.length <= 1) {
        onOpenChange(false);
      } else {
        // Move to the next photo, or previous if it was the last one
        setCurrentIndex(Math.max(0, currentIndex - 1));
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-[9999]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black text-white">
        <div className="flex-1">
          <p className="text-sm opacity-70">{currentIndex + 1} de {photos.length}</p>
          <h3 className="font-medium">{currentPhoto?.label}</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center p-4 relative">
        <img
          src={currentPhoto?.url}
          alt={currentPhoto?.label}
          className="max-w-full max-h-full object-contain"
        />

        {/* Delete Button */}
        {allowDelete && onDelete && (
            <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full h-9 w-9 hover:bg-black/75 transition-colors"
                aria-label="Eliminar foto"
            >
                <Trash2 className="h-5 w-5" />
            </Button>
        )}

        {/* Navigation buttons */}
        {hasPrevious && (
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}
        
        {hasNext && (
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="p-4 bg-black overflow-x-auto">
          <div className="flex gap-2">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                  index === currentIndex 
                    ? 'border-white' 
                    : 'border-transparent opacity-50'
                }`}
              >
                <img
                  src={photo.url}
                  alt={photo.label}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
