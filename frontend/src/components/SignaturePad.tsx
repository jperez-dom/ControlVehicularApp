import React, { useRef, useState, useEffect } from 'react';
import { Button } from './ui/button';
import { RotateCcw } from 'lucide-react';

interface SignaturePadProps {
  value?: string;
  onChange: (signature: string) => void;
  disabled?: boolean;
}

export function SignaturePad({ value, onChange, disabled = false }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Set drawing styles
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Load existing signature if provided
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setIsEmpty(false);
      };
      img.src = value;
    }
  }, [value]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;

    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
    setIsEmpty(false);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert canvas to data URL and call onChange
    const dataURL = canvas.toDataURL();
    onChange(dataURL);
  };

  const clearSignature = () => {
    if (disabled) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange('');
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <canvas
          ref={canvasRef}
          className={`w-full h-40 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 touch-none ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-crosshair'
          }`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        
        {isEmpty && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-400 text-sm">Firma aquí</span>
          </div>
        )}
        
        {disabled && isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-400 text-sm">Sin firma</span>
          </div>
        )}
      </div>
      
      {!disabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearSignature}
          disabled={isEmpty}
          className="w-full"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Borrar
        </Button>
      )}
    </div>
  );
}