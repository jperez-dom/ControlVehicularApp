import React, { useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Checkbox } from './ui/checkbox';
import { Plus, Eye, RotateCcw, Trash2 } from 'lucide-react';

interface Evidence {
  before?: string;
  after?: string;
}

interface EvidenceCardProps {
  title: string;
  evidence: Evidence;
  onEvidenceChange: (evidence: Evidence) => void;
  scratches: boolean;
  dents: boolean;
  onScratchesChange: (checked: boolean) => void;
  onDentsChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function EvidenceCard({
  title,
  evidence,
  onEvidenceChange,
  scratches,
  dents,
  onScratchesChange,
  onDentsChange,
  disabled = false
}: EvidenceCardProps) {
  const [activeTab, setActiveTab] = useState<'before' | 'after'>('before');
  const [loading, setLoading] = useState<{ before: boolean; after: boolean }>({
    before: false,
    after: false
  });

  const handleImageUpload = (type: 'before' | 'after') => {
    if (disabled) return;
    
    // Simulate image upload
    setLoading(prev => ({ ...prev, [type]: true }));
    
    // Mock upload delay
    setTimeout(() => {
      const mockImageUrl = `https://images.unsplash.com/photo-1542362567-b07e54358753?w=400&h=300&fit=crop`;
      onEvidenceChange({
        ...evidence,
        [type]: mockImageUrl
      });
      setLoading(prev => ({ ...prev, [type]: false }));
    }, 1500);
  };

  const removeImage = (type: 'before' | 'after') => {
    if (disabled) return;
    
    const newEvidence = { ...evidence };
    delete newEvidence[type];
    onEvidenceChange(newEvidence);
  };

  const ImageSlot = ({ type }: { type: 'before' | 'after' }) => {
    const hasImage = evidence[type];
    const isLoading = loading[type];

    if (isLoading) {
      return (
        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (hasImage) {
      return (
        <div className="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden">
          <ImageWithFallback
            src={evidence[type]!}
            alt={`${title} - ${type}`}
            className="w-full h-full object-cover"
          />
          {!disabled && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {/* View image */}}
                className="h-8 w-8 p-0"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleImageUpload(type)}
                className="h-8 w-8 p-0"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => removeImage(type)}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        onClick={() => handleImageUpload(type)}
        disabled={disabled}
        className="aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-center w-full h-full"
      >
        <Plus className="h-8 w-8 text-gray-400" />
        <span className="text-sm text-gray-600">
          {disabled ? "Solo lectura" : "Adjuntar imagen"}
        </span>
      </button>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <h3 className="text-center">{title}</h3>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'before' | 'after')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="before">Antes</TabsTrigger>
          <TabsTrigger value="after">Después</TabsTrigger>
        </TabsList>
        
        <TabsContent value="before" className="mt-4">
          <ImageSlot type="before" />
        </TabsContent>
        
        <TabsContent value="after" className="mt-4">
          <ImageSlot type="after" />
        </TabsContent>
      </Tabs>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`scratches-${title}`}
            checked={scratches}
            onCheckedChange={onScratchesChange}
            disabled={disabled}
          />
          <label htmlFor={`scratches-${title}`} className="text-sm">
            Rayones
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`dents-${title}`}
            checked={dents}
            onCheckedChange={onDentsChange}
            disabled={disabled}
          />
          <label htmlFor={`dents-${title}`} className="text-sm">
            Abolladuras
          </label>
        </div>
      </div>
    </div>
  );
}