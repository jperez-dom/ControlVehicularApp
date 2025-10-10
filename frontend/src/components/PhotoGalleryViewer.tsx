import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
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
  onRetake?: (photoId: string) => void;
  allowRetake?: boolean;
}

export function PhotoGalleryViewer({ 
  photos, 
  initialIndex = 0, 
  open, 
  onOpenChange,
  onRetake,
  allowRetake = false
}: PhotoGalleryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!open) return null;

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

  const handleRetake = () => {
    if (onRetake && currentPhoto) {
      onRetake(currentPhoto.id);
      onOpenChange(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col" style={{ zIndex: 9999 }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black text-white" style={{ zIndex: 9999 }}>
        <div className="flex-1">
          <p className="text-sm opacity-70">{currentIndex + 1} de {photos.length}</p>
          <h3 className="font-medium">{currentPhoto?.label}</h3>
        </div>
        <button
          onClick={() => onOpenChange(false)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center p-4 relative" style={{ zIndex: 9999 }}>
        <img
          src={currentPhoto?.url}
          alt={currentPhoto?.label}
          className="max-w-full max-h-full object-contain"
          style={{ zIndex: 9999 }}
        />

        {/* Navigation buttons */}
        {hasPrevious && (
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        
        {hasNext && (
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Footer with action buttons */}
      {allowRetake && onRetake && (
        <div className="p-4 bg-black" style={{ zIndex: 9999 }}>
          <Button
            onClick={handleRetake}
            className="w-full h-12 bg-white text-black hover:bg-gray-200"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Repetir foto
          </Button>
        </div>
      )}

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="p-4 bg-black overflow-x-auto" style={{ zIndex: 9999 }}>
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
