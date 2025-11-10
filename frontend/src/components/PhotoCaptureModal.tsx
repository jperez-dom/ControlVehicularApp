import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Camera, RotateCcw, Check } from 'lucide-react';
import { toast } from "sonner";

interface PhotoCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPhotoCapture: (photoData: string) => void;
  photoType: string;
  title?: string;
}

// Helper function to resize the image
const resizeImage = (file: File, maxWidth: number, maxHeight: number, quality: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Failed to get canvas context'));
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


export function PhotoCaptureModal({
  open,
  onOpenChange,
  onPhotoCapture,
  photoType,
  title = "Capturar fotografía"
}: PhotoCaptureModalProps) {
  const [captureState, setCaptureState] = useState<'ready' | 'capturing' | 'captured'>('ready');
  const [capturedPhoto, setCapturedPhoto] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setCaptureState('ready');
      setCapturedPhoto('');
    }
  }, [open]);

  const handleTriggerCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCaptureState('capturing');
      try {
        // Resize image to a max of 800x800 with 70% quality
        const resizedPhotoData = await resizeImage(file, 800, 800, 0.7);
        setCapturedPhoto(resizedPhotoData);
        setCaptureState('captured');
      } catch (error) {
        console.error("Error processing image:", error);
        toast.error("Error al procesar la imagen.");
        setCaptureState('ready');
      }
    }
  };

  const handleConfirm = () => {
    if (capturedPhoto) {
      onPhotoCapture(capturedPhoto); // <-- AHORA SOLO NOTIFICA AL PADRE
      toast.success('Foto guardada correctamente');
    }
  };

  const handleRetake = () => {
    // Simply trigger the file input again
    handleTriggerCapture();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[350px] rounded-lg p-0 overflow-y-auto max-h-[90vh]">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Captura una fotografía de {photoType}. Puedes repetir la captura si no estás satisfecho con el resultado.
          </DialogDescription>
        </DialogHeader>
        
        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Header */}
        <div className="bg-white text-black p-3 flex items-center justify-between border-b border-gray-200 sticky top-0 z-10">
          <h3 className="text-black text-base">{title}</h3>
        </div>

        {/* Camera View */}
        <div className="relative">
          {/* Camera viewport */}
          <div 
            className="w-full h-48 bg-gray-900 relative overflow-hidden flex items-center justify-center"
          >
            {captureState === 'ready' && (
              <div className="absolute inset-0 bg-white flex items-center justify-center">
                <div className="text-center text-black">
                  <Camera className="h-12 w-12 mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-sm">Presiona capturar para tomar la foto</p>
                </div>
              </div>
            )}

            {captureState === 'capturing' && (
              <div className="absolute inset-0 bg-white flex items-center justify-center">
                <div className="text-center text-black">
                  <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm">Procesando...</p>
                </div>
              </div>
            )}

            {captureState === 'captured' && capturedPhoto && (
              <div className="absolute inset-0">
                <img 
                  src={capturedPhoto}
                  alt="Fotografía capturada" 
                  className="w-full h-full object-cover"
                />
                {/* Retake button overlaid on the photo */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRetake}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full h-9 w-9 hover:bg-black/75 transition-colors"
                  aria-label="Repetir foto"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Camera frame overlay */}
            <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-30 pointer-events-none"></div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-3 bg-gray-50 sticky bottom-0">
          {captureState === 'ready' && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCancel}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleTriggerCapture}
              >
                <Camera className="h-4 w-4 mr-2" />
                Capturar
              </Button>
            </div>
          )}

          {captureState === 'capturing' && (
            <div className="flex justify-center">
              <div className="text-center text-gray-600">
                <p className="text-sm">Procesando imagen...</p>
              </div>
            </div>
          )}

          {captureState === 'captured' && (
            <div>
              <Button
                className="w-full"
                onClick={handleConfirm}
              >
                <Check className="h-4 w-4 mr-2" />
                Confirmar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
