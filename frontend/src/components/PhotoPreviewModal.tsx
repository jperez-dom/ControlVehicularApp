import React from 'react';
import ReactDOM from 'react-dom';
import { Button } from './ui/button';
import { X, Check, RotateCcw } from 'lucide-react';

interface PhotoPreviewModalProps {
  open: boolean;
  onConfirm: () => void;
  onRetry: () => void;
  photoData: string;
  photoType: string;
}

export function PhotoPreviewModal({ 
  open, 
  onConfirm, 
  onRetry, 
  photoData, 
  photoType 
}: PhotoPreviewModalProps) {
  if (!open) return null;

  const modalContent = (
    <div 
      style={{ 
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'black',
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div 
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '1rem',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
          zIndex: 10
        }}
      >
        <h2 style={{ color: 'white', textAlign: 'center', margin: 0 }}>{photoType}</h2>
      </div>

      {/* Image Preview */}
      <div 
        style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          padding: '1rem',
          width: '100%',
          height: '100%',
          position: 'relative',
          zIndex: 5
        }}
      >
        <img 
          src={photoData} 
          alt="Vista previa" 
          style={{ 
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            display: 'block'
          }}
        />
      </div>

      {/* Action Buttons */}
      <div 
        style={{ 
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '1.5rem',
          background: 'linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent)',
          zIndex: 10
        }}
      >
        <div style={{ maxWidth: '360px', margin: '0 auto', display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="outline"
            className="flex-1 h-12 bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={onRetry}
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Repetir
          </Button>
          <Button
            className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white border-0"
            onClick={onConfirm}
          >
            <Check className="h-5 w-5 mr-2" />
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(
    modalContent,
    document.body
  );
}