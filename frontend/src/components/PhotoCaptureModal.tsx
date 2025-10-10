import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { VisuallyHidden } from './ui/visually-hidden';
import { Button } from './ui/button';
import { Camera, RotateCcw, Check, X } from 'lucide-react';
import { toast } from "sonner@2.0.3";

interface PhotoCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPhotoCapture: (photoData: string) => void;
  photoType: string;
  title?: string;
}

export function PhotoCaptureModal({
  open,
  onOpenChange,
  onPhotoCapture,
  photoType,
  title = "Capturar fotografía"
}: PhotoCaptureModalProps) {
  const [captureState, setCaptureState] = useState<'ready' | 'capturing' | 'captured'>('ready');
  const [capturedPhoto, setCapturedPhoto] = useState<string>('');
  const videoRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setCaptureState('ready');
      setCapturedPhoto('');
    }
  }, [open]);

  // Simulate photo capture
  const handleCapture = () => {
    setCaptureState('capturing');
    
    // Simulate capture delay
    setTimeout(() => {
      // Generate a simulated photo (base64 encoded 1x1 pixel image with timestamp)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 400;
      canvas.height = 300;
      
      if (ctx) {
        // Create a gradient background to simulate a photo
        const gradient = ctx.createLinearGradient(0, 0, 400, 300);
        gradient.addColorStop(0, '#f3f4f6');
        gradient.addColorStop(0.5, '#e5e7eb');
        gradient.addColorStop(1, '#d1d5db');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, 300);
        
        // Add some "photo" content
        ctx.fillStyle = '#6b7280';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Foto: ${photoType}`, 200, 140);
        ctx.fillText(`${new Date().toLocaleString()}`, 200, 160);
        
        // Add a border
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 380, 280);
      }
      
      const photoData = canvas.toDataURL('image/jpeg', 0.5);
      setCapturedPhoto(photoData);
      setCaptureState('captured');
    }, 1500);
  };

  const handleConfirm = () => {
    if (capturedPhoto) {
      onPhotoCapture(capturedPhoto);
      onOpenChange(false);
      toast.success('Foto guardada correctamente');
    }
  };

  const handleRetake = () => {
    setCaptureState('ready');
    setCapturedPhoto('');
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
        
        {/* Header */}
        <div className="bg-white text-black p-3 flex items-center justify-between border-b border-gray-200 sticky top-0 z-10">
          <h3 className="text-black text-base">{title}</h3>

        </div>

        {/* Camera View */}
        <div className="relative">
          {/* Camera viewport */}
          <div 
            ref={videoRef}
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
                  <p className="text-sm">Capturando...</p>
                </div>
              </div>
            )}

            {captureState === 'captured' && capturedPhoto && (
              <div className="absolute inset-0">
                <img 
                  src="https://images.unsplash.com/photo-1733534816908-650eaf9271f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBkYXNoYm9hcmQlMjBleGFtcGxlfGVufDF8fHx8MTc1OTc5MzcwOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
                  alt="Foto de ejemplo" 
                  className="w-full h-full object-cover"
                />
                {/* Success overlay */}
                <div className="absolute top-2 right-2 bg-black text-white rounded-full p-1">
                  <Check className="h-4 w-4" />
                </div>
              </div>
            )}

            {/* Camera frame overlay */}
            <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-30 pointer-events-none"></div>
          </div>

          {/* Photo type indicator */}

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
                onClick={handleCapture}
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
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleRetake}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Repetir
              </Button>
              <Button
                className="flex-1"
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