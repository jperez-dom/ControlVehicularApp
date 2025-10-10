import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ArrowLeft, Camera, Check, Plus, X } from 'lucide-react';
import { CalendarPicker } from './CalendarPicker';
import { BottomSheetDatePicker } from './BottomSheet';
import { SignaturePad } from './SignaturePad';
import { FuelGauge } from './FuelGauge';
import { PhotoCaptureModal } from './PhotoCaptureModal';
import { PhotoPreviewModal } from './PhotoPreviewModal';
import { PhotoGalleryViewer } from './PhotoGalleryViewer';
import { toast } from "sonner@2.0.3";
import grupoOptimoLogo from 'figma:asset/220b05f22fbef50eaf6e2085eb40125dfd99d55b.png';

interface Destino {
  id: string;
  estado: string;
  ciudad: string;
  comentario: string;
}

interface FichaGuardada {
  folio: string;
  conductorNombre: string;
  conductorCargo: string;
  destinos: Destino[];
  fechaCreacion: string;
  estado: 'creada' | 'con-entrada' | 'con-salida' | 'completada';
  entradaData?: any;
  salidaData?: any;
}

interface FotoInterior {
  id: string;
  tipo: string;
  foto: string;
}

interface FormularioEntradaProps {
  ficha: FichaGuardada;
  onBack: () => void;
  onComplete: (entradaData: any) => void;
}

export function FormularioEntrada({ ficha, onBack, onComplete }: FormularioEntradaProps) {
  const [formData, setFormData] = useState({
    fechaEntrada: '',
    horaEntrada: '',
    kmEntrada: '',
    combustible: '',
    fotos: {
      fotoFrontal: '',
      fotoLatDer: '',
      fotoLatIzq: '',
      fotoPosterior: '',
      fotoKilometraje: ''
    },
    fotosInteriores: [
      { id: '1', tipo: 'Tablero', foto: '' }
    ] as FotoInterior[],
    comentarios: '',
    firmaConductor: '',
    firmaAprobador: ''
  });

  const [errors, setErrors] = useState({
    fechaEntrada: false,
    horaEntrada: false,
    kmEntrada: false,
    combustible: false,
    fotos: false,
    fotosInteriores: false,
    firmaConductor: false,
    firmaAprobador: false
  });

  // Tipos disponibles para fotos interiores
  const tiposDisponibles = ['Tablero', 'Asiento del.', 'Asiento tras.', 'Cajuela', 'Volante', 'Palanca cambios'];
  
  // Estado para el modal de captura de foto
  const [photoCaptureModal, setPhotoCaptureModal] = useState({
    open: false,
    photoType: '',
    photoKey: '',
    interiorPhotoId: ''
  });

  // Estado para el modal de vista previa de foto
  const [photoPreview, setPhotoPreview] = useState({
    open: false,
    photoData: '',
    photoType: '',
    photoKey: '',
    interiorPhotoId: ''
  });

  // Estado para el visor de galería
  const [galleryViewer, setGalleryViewer] = useState({
    open: false,
    initialIndex: 0
  });

  // Estado para ver fotos ya capturadas
  const [photoViewer, setPhotoViewer] = useState({
    open: false,
    photoData: '',
    photoType: '',
    photoKey: '',
    interiorPhotoId: ''
  });

  const updateFormData = (field: string, value: string) => {
    if (field.startsWith('foto') && !field.includes('fotosInteriores')) {
      setFormData(prev => ({
        ...prev,
        fotos: { ...prev.fotos, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear error when user fills field
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  const addFotoInterior = () => {
    if (formData.fotosInteriores.length >= 6) return;
    
    // Encontrar el primer tipo disponible que no esté en uso
    const tiposEnUso = formData.fotosInteriores.map(f => f.tipo);
    const tipoDisponible = tiposDisponibles.find(tipo => !tiposEnUso.includes(tipo));
    
    if (!tipoDisponible) return;
    
    const nuevaFoto: FotoInterior = {
      id: Date.now().toString(),
      tipo: tipoDisponible,
      foto: ''
    };
    
    setFormData(prev => ({
      ...prev,
      fotosInteriores: [...prev.fotosInteriores, nuevaFoto]
    }));
  };

  const removeFotoInterior = (id: string) => {
    if (formData.fotosInteriores.length <= 1) return; // Mínimo 1 foto
    
    setFormData(prev => ({
      ...prev,
      fotosInteriores: prev.fotosInteriores.filter(f => f.id !== id)
    }));
  };

  const handleInteriorPhotoCapture = (id: string) => {
    // Encontrar el tipo de foto interior
    const fotoInterior = formData.fotosInteriores.find(f => f.id === id);
    if (!fotoInterior) return;
    
    // Abrir modal de captura para foto interior
    setPhotoCaptureModal({
      open: true,
      photoType: fotoInterior.tipo,
      photoKey: '',
      interiorPhotoId: id
    });
  };

  const getInteriorPhotoStatus = (id: string) => {
    const foto = formData.fotosInteriores.find(f => f.id === id);
    return foto?.foto ? 'captured' : 'pending';
  };

  // Función para abrir el visor de galería con una foto específica
  const openPhotoGallery = (photoKey: string, interiorPhotoId?: string) => {
    const photos = [];
    
    // Agregar foto de odómetro si existe
    if (formData.fotos.fotoKilometraje) {
      photos.push({
        id: 'fotoKilometraje',
        url: formData.fotos.fotoKilometraje,
        label: 'Odómetro'
      });
    }
    
    // Agregar fotos exteriores
    const exteriorPhotos = [
      { key: 'fotoFrontal', label: 'Frontal' },
      { key: 'fotoLatDer', label: 'Lateral derecho' },
      { key: 'fotoLatIzq', label: 'Lateral izquierdo' },
      { key: 'fotoPosterior', label: 'Posterior' }
    ];
    
    exteriorPhotos.forEach(foto => {
      if (formData.fotos[foto.key as keyof typeof formData.fotos]) {
        photos.push({
          id: foto.key,
          url: formData.fotos[foto.key as keyof typeof formData.fotos],
          label: foto.label
        });
      }
    });
    
    // Agregar fotos interiores
    formData.fotosInteriores.forEach(foto => {
      if (foto.foto) {
        photos.push({
          id: foto.id,
          url: foto.foto,
          label: foto.tipo
        });
      }
    });
    
    // Encontrar el índice de la foto que se tocó
    let initialIndex = 0;
    if (interiorPhotoId) {
      initialIndex = photos.findIndex(p => p.id === interiorPhotoId);
    } else {
      initialIndex = photos.findIndex(p => p.id === photoKey);
    }
    
    if (initialIndex === -1) initialIndex = 0;
    
    setGalleryViewer({
      open: true,
      initialIndex
    });
  };

  // Función para ver una foto capturada
  const handleViewCapturedPhoto = (photoKey: string, interiorPhotoId?: string) => {
    openPhotoGallery(photoKey, interiorPhotoId);
  };

  // Función para manejar la confirmación de la foto capturada
  const handlePhotoConfirm = (photoData: string) => {
    if (photoCaptureModal.photoKey) {
      // Es una foto exterior u odómetro
      updateFormData(photoCaptureModal.photoKey, photoData);
    } else if (photoCaptureModal.interiorPhotoId) {
      // Es una foto interior
      setFormData(prev => ({
        ...prev,
        fotosInteriores: prev.fotosInteriores.map(f => 
          f.id === photoCaptureModal.interiorPhotoId ? { ...f, foto: photoData } : f
        )
      }));
    }
    
    // Cerrar modal
    setPhotoCaptureModal({
      open: false,
      photoType: '',
      photoKey: '',
      interiorPhotoId: ''
    });
  };

  // Función para cerrar el modal sin guardar
  const handlePhotoCaptureCancel = (open: boolean) => {
    if (!open) {
      setPhotoCaptureModal({
        open: false,
        photoType: '',
        photoKey: '',
        interiorPhotoId: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {
      fechaEntrada: !formData.fechaEntrada,
      horaEntrada: !formData.horaEntrada,
      kmEntrada: !formData.kmEntrada || parseInt(formData.kmEntrada.replace(/,/g, '')) <= 0,
      combustible: !formData.combustible,
      fotos: !formData.fotos.fotoFrontal || !formData.fotos.fotoLatDer || 
             !formData.fotos.fotoLatIzq || !formData.fotos.fotoPosterior || !formData.fotos.fotoKilometraje,
      fotosInteriores: formData.fotosInteriores.some(f => !f.foto),
      firmaConductor: !formData.firmaConductor,
      firmaAprobador: !formData.firmaAprobador
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }
    
    onComplete(formData);
    toast.success('Entrada registrada correctamente');
  };

  const formatKm = (value: string) => {
    const numValue = value.replace(/[^0-9]/g, '');
    return numValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatKm(e.target.value);
    updateFormData('kmEntrada', formatted);
  };

  const handlePhotoCapture = (photoType: string) => {
    // Abrir modal de captura con información del tipo de foto
    const photoLabels: { [key: string]: string } = {
      'fotoKilometraje': 'Odómetro',
      'fotoFrontal': 'Frontal',
      'fotoLatDer': 'Lateral derecho',
      'fotoLatIzq': 'Lateral izquierdo',
      'fotoPosterior': 'Posterior'
    };
    
    setPhotoCaptureModal({
      open: true,
      photoType: photoLabels[photoType] || photoType,
      photoKey: photoType,
      interiorPhotoId: ''
    });
  };

  const getPhotoStatus = (photoType: string) => {
    const photoData = formData.fotos[photoType as keyof typeof formData.fotos];
    return photoData ? 'captured' : 'pending';
  };

  // Función para comprimir imagen
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Reducir tamaño máximo a 800px manteniendo aspect ratio
          const maxSize = 800;
          let width = img.width;
          let height = img.height;
          
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Comprimir a calidad 0.6 para reducir tamaño
            const compressed = canvas.toDataURL('image/jpeg', 0.6);
            resolve(compressed);
          } else {
            reject(new Error('No se pudo crear el canvas'));
          }
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Función para convertir archivo de imagen a base64 y mostrar vista previa
  const handleFileCapture = async (file: File, photoKey: string, interiorPhotoId?: string) => {
    try {
      const base64String = await compressImage(file);
      
      // Determinar el tipo de foto para el título
      let photoType = '';
      if (interiorPhotoId) {
        const fotoInterior = formData.fotosInteriores.find(f => f.id === interiorPhotoId);
        photoType = fotoInterior?.tipo || 'Foto interior';
      } else {
        const photoLabels: { [key: string]: string } = {
          'fotoKilometraje': 'Odómetro',
          'fotoFrontal': 'Frontal',
          'fotoLatDer': 'Lateral derecho',
          'fotoLatIzq': 'Lateral izquierdo',
          'fotoPosterior': 'Posterior'
        };
        photoType = photoLabels[photoKey] || photoKey;
      }
      
      // Abrir modal de vista previa
      setPhotoPreview({
        open: true,
        photoData: base64String,
        photoType,
        photoKey,
        interiorPhotoId: interiorPhotoId || ''
      });
    } catch (error) {
      console.error('Error comprimiendo imagen:', error);
      toast.error('Error al procesar la imagen');
    }
  };

  // Confirmar foto desde vista previa
  const handlePhotoPreviewConfirm = () => {
    if (photoPreview.interiorPhotoId) {
      // Es una foto interior
      setFormData(prev => ({
        ...prev,
        fotosInteriores: prev.fotosInteriores.map(f => 
          f.id === photoPreview.interiorPhotoId ? { ...f, foto: photoPreview.photoData } : f
        )
      }));
    } else {
      // Es una foto exterior u odómetro
      updateFormData(photoPreview.photoKey, photoPreview.photoData);
    }
    
    // Cerrar modal de vista previa
    setPhotoPreview({
      open: false,
      photoData: '',
      photoType: '',
      photoKey: '',
      interiorPhotoId: ''
    });
  };

  // Repetir foto desde vista previa
  const handlePhotoPreviewRetry = () => {
    // Simplemente cerrar el modal para que el usuario pueda volver a capturar
    setPhotoPreview({
      open: false,
      photoData: '',
      photoType: '',
      photoKey: '',
      interiorPhotoId: ''
    });
  };

  // Repetir foto desde el visor
  const handleRetakeFromViewer = () => {
    // Limpiar la foto actual
    if (photoViewer.interiorPhotoId) {
      setFormData(prev => ({
        ...prev,
        fotosInteriores: prev.fotosInteriores.map(f => 
          f.id === photoViewer.interiorPhotoId ? { ...f, foto: '' } : f
        )
      }));
    } else {
      updateFormData(photoViewer.photoKey, '');
    }
    
    // Cerrar el visor
    setPhotoViewer({
      open: false,
      photoData: '',
      photoType: '',
      photoKey: '',
      interiorPhotoId: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Safe Area Top */}
      <div className="h-12 bg-[rgba(0,0,0,1)]"></div>
      
      {/* Header */}
      <div className="space-y-0">
        {/* Logo header with black background */}
        <div className="bg-black px-[16px] py-[5px]">
          <div className="flex items-center justify-center">
            <img 
              src={grupoOptimoLogo} 
              alt="GRUPO OPTIMO" 
              className="h-12 w-auto object-contain px-[54px] py-[0px]"
            />
          </div>
        </div>
        
        {/* Title section */}
        <div className="bg-white px-4 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-2 h-auto"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-black text-xl flex-1 text-center mr-11">Entrada</h1>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="overflow-y-auto pb-32">
        <div className="max-w-[360px] mx-auto px-4 py-6 space-y-6">
          
          {/* Información de la ficha */}
          <div className="bg-white border border-black rounded-lg p-3">
            <p className="text-black text-center">Ficha: {ficha.folio}</p>
          </div>

          {/* Formulario */}
          <div className="bg-white rounded-lg p-4 space-y-4">
            {/* Fecha y hora */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>
                  Fecha
                </Label>
                <div className="mt-1">
                  <CalendarPicker
                    id="fechaEntrada"
                    value={formData.fechaEntrada}
                    onValueChange={(value) => updateFormData('fechaEntrada', value)}
                    placeholder="Fecha"
                  />
                </div>
              </div>
              
              <div>
                <Label>
                  Hora
                </Label>
                <div className="mt-1">
                  <BottomSheetDatePicker
                    id="horaEntrada"
                    mode="time"
                    value={formData.horaEntrada}
                    onValueChange={(value) => updateFormData('horaEntrada', value)}
                    placeholder="Hora"
                  />
                </div>
              </div>
            </div>

            {/* Kilometraje con evidencia */}
            <div>
              <Label>
                Kilometraje
              </Label>
              <div className="space-y-3">
                <Input
                  id="kmEntrada"
                  value={formData.kmEntrada}
                  onChange={handleKmChange}
                  placeholder="0"
                  className="mt-1 h-10"
                />
                
                {/* Evidencia del kilometraje */}
                <div>
                  <Label className="text-sm">Evidencia del odómetro</Label>
                  <div className="grid grid-cols-4 gap-1">
                    {getPhotoStatus('fotoKilometraje') === 'captured' ? (
                      <button
                        type="button"
                        onClick={() => handleViewCapturedPhoto('fotoKilometraje')}
                        className="aspect-square rounded-md border border-dashed p-0 flex items-center justify-center transition-colors cursor-pointer border-green-500 bg-green-50 text-green-600"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                    ) : (
                      <label
                        className="aspect-square rounded-md border border-dashed p-0 flex items-center justify-center transition-colors cursor-pointer border-gray-300 hover:border-gray-400 text-gray-500"
                      >
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileCapture(file, 'fotoKilometraje');
                            }
                            // Reset input para permitir capturar la misma foto de nuevo
                            e.target.value = '';
                          }}
                        />
                        <Camera className="h-4 w-4" />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Medidor de combustible */}
            <div>
              <Label>
                Nivel de combustible
              </Label>
              <div className="mt-2">
                <FuelGauge
                  value={parseInt(formData.combustible) || 0}
                  onChange={(value) => updateFormData('combustible', value.toString())}
                  label="Selecciona el nivel de combustible"
                />
              </div>
            </div>

            {/* Evidencia fotográfica exterior */}
            <div>
              <Label>
                Evidencia fotográfica (exterior)
              </Label>
              <div className="mt-2 grid grid-cols-4 gap-1">
                {[
                  { key: 'fotoFrontal', label: 'Frontal' },
                  { key: 'fotoLatDer', label: 'Lateral der.' },
                  { key: 'fotoLatIzq', label: 'Lateral izq.' },
                  { key: 'fotoPosterior', label: 'Posterior' }
                ].map((foto) => (
                  getPhotoStatus(foto.key) === 'captured' ? (
                    <button
                      key={foto.key}
                      type="button"
                      onClick={() => handleViewCapturedPhoto(foto.key)}
                      className="aspect-square rounded-md border border-dashed p-0 flex items-center justify-center transition-colors cursor-pointer border-green-500 bg-green-50 text-green-600"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  ) : (
                    <label
                      key={foto.key}
                      className="aspect-square rounded-md border border-dashed p-0 flex items-center justify-center transition-colors cursor-pointer border-gray-300 hover:border-gray-400 text-gray-500"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileCapture(file, foto.key);
                          }
                          e.target.value = '';
                        }}
                      />
                      <Camera className="h-4 w-4" />
                    </label>
                  )
                ))}
              </div>
            </div>

            {/* Evidencia fotográfica interior */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>
                  Evidencia fotográfica (interior)
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFotoInterior}
                  className="h-8"
                  disabled={formData.fotosInteriores.length >= 6}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Más
                </Button>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-1">
                {formData.fotosInteriores.map((foto) => (
                  <div key={foto.id} className="relative">
                    {getInteriorPhotoStatus(foto.id) === 'captured' ? (
                      <button
                        type="button"
                        onClick={() => handleViewCapturedPhoto('', foto.id)}
                        className="w-full aspect-square rounded-md border border-dashed p-0 flex items-center justify-center transition-colors cursor-pointer border-green-500 bg-green-50 text-green-600"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                    ) : (
                      <label
                        className="w-full aspect-square rounded-md border border-dashed p-0 flex items-center justify-center transition-colors cursor-pointer border-gray-300 hover:border-gray-400 text-gray-500"
                      >
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileCapture(file, '', foto.id);
                            }
                            e.target.value = '';
                          }}
                        />
                        <Camera className="h-4 w-4" />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Comentarios */}
            <div>
              <Label htmlFor="comentarios">
                Comentarios (opcional)
              </Label>
              <div className="mt-2">
                <Textarea
                  id="comentarios"
                  placeholder="Escribe observaciones o comentarios adicionales..."
                  value={formData.comentarios}
                  onChange={(e) => updateFormData('comentarios', e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Firmas */}
            <div className="space-y-4">
              <div>
                <Label>
                  Firma del conductor
                </Label>
                <div className="mt-2">
                  <SignaturePad
                    id="firmaConductor"
                    onSignatureChange={(signature) => updateFormData('firmaConductor', signature)}
                    clearButtonText="Borrar"
                  />
                </div>
              </div>

              <div>
                <Label>
                  Firma de quien aprueba
                </Label>
                <div className="mt-2">
                  <SignaturePad
                    id="firmaAprobador"
                    onSignatureChange={(signature) => updateFormData('firmaAprobador', signature)}
                    clearButtonText="Borrar"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 shadow-lg z-40">
        <div className="max-w-[360px] mx-auto">
          <Button
            id="guardarEntradaBtn"
            className="w-full h-12"
            onClick={() => {
              // SIEMPRE guardar sin importar qué, sin validaciones
              onComplete(formData);
              toast.success('Entrada registrada correctamente');
            }}
          >
            Guardar
          </Button>
        </div>
      </div>

      {/* Modal de captura de fotografía */}
      <PhotoCaptureModal
        open={photoCaptureModal.open}
        onOpenChange={handlePhotoCaptureCancel}
        onPhotoCapture={handlePhotoConfirm}
        photoType={photoCaptureModal.photoType}
        title={`Capturar foto: ${photoCaptureModal.photoType}`}
      />

      {/* Modal de vista previa de foto */}
      <PhotoPreviewModal
        open={photoPreview.open}
        onConfirm={handlePhotoPreviewConfirm}
        onRetry={handlePhotoPreviewRetry}
        photoData={photoPreview.photoData}
        photoType={photoPreview.photoType}
      />

      {/* Modal para ver foto capturada con opción de repetir */}
      {photoViewer.open && (
        <PhotoPreviewModal
          open={photoViewer.open}
          onConfirm={() => {
            setPhotoViewer({
              open: false,
              photoData: '',
              photoType: '',
              photoKey: '',
              interiorPhotoId: ''
            });
          }}
          onRetry={handleRetakeFromViewer}
          photoData={photoViewer.photoData}
          photoType={photoViewer.photoType}
        />
      )}

      {/* Visor de galería de fotos */}
      <PhotoGalleryViewer
        photos={(() => {
          const photos = [];
          
          if (formData.fotos.fotoKilometraje) {
            photos.push({
              id: 'fotoKilometraje',
              url: formData.fotos.fotoKilometraje,
              label: 'Odómetro'
            });
          }
          
          const exteriorPhotos = [
            { key: 'fotoFrontal', label: 'Frontal' },
            { key: 'fotoLatDer', label: 'Lateral derecho' },
            { key: 'fotoLatIzq', label: 'Lateral izquierdo' },
            { key: 'fotoPosterior', label: 'Posterior' }
          ];
          
          exteriorPhotos.forEach(foto => {
            if (formData.fotos[foto.key as keyof typeof formData.fotos]) {
              photos.push({
                id: foto.key,
                url: formData.fotos[foto.key as keyof typeof formData.fotos],
                label: foto.label
              });
            }
          });
          
          formData.fotosInteriores.forEach(foto => {
            if (foto.foto) {
              photos.push({
                id: foto.id,
                url: foto.foto,
                label: foto.tipo
              });
            }
          });
          
          return photos;
        })()}
        initialIndex={galleryViewer.initialIndex}
        open={galleryViewer.open}
        onOpenChange={(open) => setGalleryViewer({ ...galleryViewer, open })}
      />
    </div>
  );
}