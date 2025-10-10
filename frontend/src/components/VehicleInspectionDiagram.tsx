import React, { useState, useRef } from 'react';
import { X, Camera, ImageIcon, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import vehicleDiagram from 'figma:asset/437977ebb95acc3f4071e4ec6880adc71c18a799.png';

interface DamageMarker {
  id: string;
  x: number;
  y: number;
  type: 'scratch' | 'dent' | 'other';
  images?: string[];
}

interface VehicleInspectionDiagramProps {
  onMarkersChange?: (markers: DamageMarker[]) => void;
  disabled?: boolean;
}

export function VehicleInspectionDiagram({ onMarkersChange, disabled = false }: VehicleInspectionDiagramProps) {
  const [markers, setMarkers] = useState<DamageMarker[]>([]);
  const [selectedMarkerType, setSelectedMarkerType] = useState<'scratch' | 'dent' | 'other'>('scratch');
  const [selectedMarker, setSelectedMarker] = useState<DamageMarker | null>(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;

    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const newMarker: DamageMarker = {
      id: Date.now().toString(),
      x,
      y,
      type: selectedMarkerType,
      images: []
    };

    const updatedMarkers = [...markers, newMarker];
    setMarkers(updatedMarkers);
    onMarkersChange?.(updatedMarkers);
  };

  const removeMarker = (markerId: string) => {
    if (disabled) return;
    
    const updatedMarkers = markers.filter(marker => marker.id !== markerId);
    setMarkers(updatedMarkers);
    onMarkersChange?.(updatedMarkers);
  };

  const getMarkerColor = (type: DamageMarker['type']) => {
    switch (type) {
      case 'scratch': return 'bg-red-500';
      case 'dent': return 'bg-orange-500';
      case 'other': return 'bg-blue-500';
    }
  };

  const getMarkerBorderColor = (type: DamageMarker['type']) => {
    switch (type) {
      case 'scratch': return 'border-red-600';
      case 'dent': return 'border-orange-600';
      case 'other': return 'border-blue-600';
    }
  };

  const handleImageUpload = (markerId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        
        const updatedMarkers = markers.map(marker => {
          if (marker.id === markerId) {
            return {
              ...marker,
              images: [...(marker.images || []), imageUrl]
            };
          }
          return marker;
        });
        
        setMarkers(updatedMarkers);
        onMarkersChange?.(updatedMarkers);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMarkerImage = (markerId: string, imageIndex: number) => {
    const updatedMarkers = markers.map(marker => {
      if (marker.id === markerId) {
        const newImages = [...(marker.images || [])];
        newImages.splice(imageIndex, 1);
        return {
          ...marker,
          images: newImages
        };
      }
      return marker;
    });
    
    setMarkers(updatedMarkers);
    onMarkersChange?.(updatedMarkers);
  };

  const openImageDialog = (marker: DamageMarker) => {
    setSelectedMarker(marker);
    setIsImageDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg mb-3">Inspección visual del vehículo</h3>
        <p className="text-sm text-gray-600 mb-4">
          Toca sobre el diagrama para marcar áreas con daños. Usa el ícono de cámara para agregar evidencia fotográfica a cada marca.
        </p>
      </div>

      {!disabled && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            type="button"
            variant={selectedMarkerType === 'scratch' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedMarkerType('scratch')}
            className="text-xs"
          >
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            Rayones
          </Button>
          <Button
            type="button"
            variant={selectedMarkerType === 'dent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedMarkerType('dent')}
            className="text-xs"
          >
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            Abolladuras
          </Button>
          <Button
            type="button"
            variant={selectedMarkerType === 'other' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedMarkerType('other')}
            className="text-xs"
          >
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            Otros
          </Button>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div 
          ref={imageRef}
          className="relative w-full cursor-pointer select-none"
          onClick={handleImageClick}
          style={{ aspectRatio: '1' }}
        >
          <img 
            src={vehicleDiagram} 
            alt="Diagrama del vehículo"
            className="w-full h-full object-contain"
            draggable={false}
          />
          
          {markers.map((marker) => (
            <div
              key={marker.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${marker.x}%`,
                top: `${marker.y}%`
              }}
            >
              {/* Marcador principal */}
              <div
                className={`w-6 h-6 ${getMarkerColor(marker.type)} ${getMarkerBorderColor(marker.type)} border-2 rounded-full flex items-center justify-center cursor-pointer group relative`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disabled) openImageDialog(marker);
                }}
              >
                {/* Icono principal - siempre ojo blanco */}
                <Eye className="w-3 h-3 text-white" />
                
                {/* Indicador de número de imágenes */}
                {marker.images && marker.images.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                    <span className="text-xs text-white leading-none">{marker.images.length}</span>
                  </div>
                )}
                
                {/* Botón de eliminar al hacer hover */}
                {!disabled && (
                  <div className="absolute inset-0 rounded-full flex items-center justify-center">
                    <Eye className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {markers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm mb-2">Daños marcados ({markers.length})</h4>
            <div className="flex flex-wrap gap-1">
              {markers.map((marker) => (
                <div
                  key={marker.id}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getMarkerColor(marker.type)} text-white`}
                >
                  <span className="capitalize">{marker.type === 'scratch' ? 'Rayón' : marker.type === 'dent' ? 'Abolladura' : 'Otro'}</span>
                  
                  {/* Indicador de imágenes */}
                  {marker.images && marker.images.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      <span>{marker.images.length}</span>
                    </span>
                  )}
                  
                  {!disabled && (
                    <>
                      {/* Botón para ver/agregar imágenes */}
                      <button
                        onClick={() => openImageDialog(marker)}
                        className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5"
                        title="Ver/agregar imágenes"
                      >
                        <Camera className="w-3 h-3" />
                      </button>
                      
                      {/* Botón para eliminar marcador */}
                      <button
                        onClick={() => removeMarker(marker.id)}
                        className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5"
                        title="Eliminar marcador"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {markers.length === 0 && (
          <p className="text-center text-gray-500 text-sm mt-4">
            {disabled ? 'No hay daños marcados' : 'Toca sobre el diagrama para marcar daños'}
          </p>
        )}
      </div>
      
      {/* Dialog para gestionar imágenes del marcador */}
      {isImageDialogOpen && selectedMarker !== null && (
        <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedMarker 
                ? `Evidencia fotográfica - ${selectedMarker.type === 'scratch' ? 'Rayón' : selectedMarker.type === 'dent' ? 'Abolladura' : 'Otro'}`
                : 'Evidencia fotográfica del vehículo'
              }
            </DialogTitle>
            <DialogDescription>
              Gestiona las fotos de evidencia para este marcador
            </DialogDescription>
          </DialogHeader>
          
          {selectedMarker && (
            <div className="space-y-4">
              {/* Botón para agregar imágenes */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageUpload(selectedMarker.id, e)}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  variant="outline"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Agregar imagen
                </Button>
              </div>
              
              {/* Galería de imágenes */}
              {selectedMarker.images && selectedMarker.images.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-sm">Imágenes ({selectedMarker.images.length})</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedMarker.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Evidencia ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <button
                          onClick={() => removeMarkerImage(selectedMarker.id, index)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay imágenes agregadas</p>
                  <p className="text-xs">Toca "Agregar imagen" para incluir evidencia fotográfica</p>
                </div>
              )}
            </div>
          )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}