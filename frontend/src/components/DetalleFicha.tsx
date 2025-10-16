import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { VisuallyHidden } from './ui/visually-hidden';
import { ArrowLeft, Eye, CheckCircle, X, Mail } from 'lucide-react';
import { PhotoGalleryViewer } from './PhotoGalleryViewer';
import { toast } from "sonner";
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
  vehiculo?: string;
  destinos: Destino[];
  fechaCreacion: string;
  estado: 'creada' | 'con-entrada' | 'con-salida' | 'completada';
  entradaData?: any;
  salidaData?: any;
}

interface DetalleFichaProps {
  ficha: FichaGuardada;
  onBack: () => void;
  onGoToEntrada: () => void;
  onGoToSalida: () => void;
  getEstadoLabel: (value: string) => string;
  getCiudadLabel: (estadoValue: string, ciudadValue: string) => string;
  getVehicleName?: (value: string) => string;
}

export function DetalleFicha({
  ficha,
  onBack,
  onGoToEntrada,
  onGoToSalida,
  getEstadoLabel,
  getCiudadLabel,
  getVehicleName
}: DetalleFichaProps) {
  const [showEntradaModal, setShowEntradaModal] = useState(false);
  const [showSalidaModal, setShowSalidaModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showEnvioModal, setShowEnvioModal] = useState(false);
  const [emailDestino, setEmailDestino] = useState('');
  const [galleryViewer, setGalleryViewer] = useState({
    open: false,
    initialIndex: 0,
    isEntrada: true
  });

  const handleVerEntrada = () => {
    setShowEntradaModal(true);
  };

  const handleVerSalida = () => {
    setShowSalidaModal(true);
  };

  const handleImageClick = (photoId: string, isEntrada: boolean = true) => {
    // Recopilar todas las fotos disponibles
    const photos = [];
    const data = isEntrada ? ficha.entradaData : ficha.salidaData;
    
    if (data?.fotos) {
      // Odómetro
      if (data.fotos.fotoKilometraje) {
        photos.push({
          id: 'fotoKilometraje',
          url: data.fotos.fotoKilometraje,
          label: 'Odómetro'
        });
      }
      
      // Fotos exteriores
      const exteriorPhotos = [
        { key: 'fotoFrontal', label: 'Frontal' },
        { key: 'fotoLatDer', label: 'Lateral derecho' },
        { key: 'fotoLatIzq', label: 'Lateral izquierdo' },
        { key: 'fotoPosterior', label: 'Posterior' }
      ];
      
      exteriorPhotos.forEach(foto => {
        if (data.fotos[foto.key]) {
          photos.push({
            id: foto.key,
            url: data.fotos[foto.key],
            label: foto.label
          });
        }
      });
    }
    
    // Fotos interiores (fotosInteriores)
    if (data?.fotosInteriores && Array.isArray(data.fotosInteriores)) {
      data.fotosInteriores.forEach((foto: any) => {
        if (foto.foto) {
          photos.push({
            id: foto.id,
            url: foto.foto,
            label: foto.tipo
          });
        }
      });
    }
    
    // Evidencias internas (formato anterior - mantener por compatibilidad)
    if (data?.evidenciasInternas) {
      Object.entries(data.evidenciasInternas).forEach(([key, evidence]: [string, any]) => {
        if (evidence.foto) {
          photos.push({
            id: key,
            url: evidence.foto,
            label: evidence.tipo
          });
        }
      });
    }
    
    // Encontrar el índice de la foto seleccionada
    const initialIndex = photos.findIndex(p => p.id === photoId);
    
    setGalleryViewer({
      open: true,
      initialIndex: initialIndex !== -1 ? initialIndex : 0,
      isEntrada: isEntrada
    });
  };

  const handleOpenEnvioModal = () => {
    setShowEnvioModal(true);
  };

  const handleEnviarFicha = () => {
    if (!emailDestino.trim()) {
      toast.error('Por favor ingresa un email de destino');
      return;
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailDestino)) {
      toast.error('Por favor ingresa un email válido');
      return;
    }

    // Simular envío de ficha por correo
    toast.success(`Ficha ${ficha.folio} enviada a ${emailDestino}`);
    
    // Cerrar modal y limpiar campo
    setShowEnvioModal(false);
    setEmailDestino('');
  };

  const getImageDisplayName = (key: string) => {
    const imageNames: { [key: string]: string } = {
      'fotoFrontal': 'Vista frontal',
      'fotoLatDer': 'Lateral derecho',
      'fotoLatIzq': 'Lateral izquierdo',
      'fotoPosterior': 'Vista posterior',
      'fotoTablero': 'Tablero',
      'fotoInterior': 'Interior'
    };
    return imageNames[key] || key;
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
            <h1 className="text-black text-xl flex-1 text-center mr-11">Detalle de ficha</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[360px] mx-auto px-4 py-6 pb-32">
        {/* Ficha Card */}
        <div id="fichaCard" className="bg-white rounded-lg p-6 shadow-md mb-6">
          {/* Header del card */}
          <div className="mb-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="text-lg text-black">{ficha.folio}</h2>
                <p className="text-black">{ficha.conductorNombre}</p>
                <p className="text-gray-500 text-sm">{ficha.conductorCargo}</p>
                {ficha.vehiculo && getVehicleName && (
                  <p className="text-gray-500 text-sm">{getVehicleName(ficha.vehiculo)}</p>
                )}
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                  ficha.estado === 'creada' ? 'bg-blue-100 text-blue-700' :
                  ficha.estado === 'con-entrada' ? 'bg-green-100 text-green-700' :
                  ficha.estado === 'con-salida' ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  <div className={`h-2 w-2 rounded-full ${
                    ficha.estado === 'creada' ? 'bg-blue-500' :
                    ficha.estado === 'con-entrada' ? 'bg-green-500' :
                    ficha.estado === 'con-salida' ? 'bg-orange-500' :
                    'bg-gray-500'
                  }`}></div>
                  {ficha.estado === 'creada' ? 'Creada' :
                   ficha.estado === 'con-entrada' ? 'Con entrada' :
                   ficha.estado === 'con-salida' ? 'Con salida' :
                   'Completada'}
                </div>
              </div>
            </div>
          </div>

          {/* Información de entrada (si existe) */}
          {(ficha.estado === 'con-entrada' || ficha.estado === 'con-salida' || ficha.estado === 'completada') && ficha.entradaData && (
            <div className="border-t pt-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-500 text-sm">Entrada registrada</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVerEntrada}
                  className="h-7 text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Ver entrada
                </Button>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Fecha/Hora</p>
                    <p className="text-black">{ficha.entradaData.fechaEntrada}</p>
                    <p className="text-gray-500 text-xs">{ficha.entradaData.horaEntrada}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Kilometraje</p>
                    <p className="text-black">{ficha.entradaData.kmEntrada} km</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-green-700 text-sm">Entrega completada</span>
                </div>
              </div>
            </div>
          )}

          {/* Información de salida (si existe) */}
          {(ficha.estado === 'con-salida' || ficha.estado === 'completada') && ficha.salidaData && (
            <div className="border-t pt-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-500 text-sm">Salida registrada</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVerSalida}
                  className="h-7 text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Ver salida
                </Button>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Fecha/Hora</p>
                    <p className="text-black">{ficha.salidaData.fechaSalida}</p>
                    <p className="text-gray-500 text-xs">{ficha.salidaData.horaSalida}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Kilometraje</p>
                    <p className="text-black">{ficha.salidaData.kmSalida} km</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-orange-700 text-sm">Salida registrada</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Sección Ruta */}
          <div className="border-t pt-4">
            <h3 className="text-gray-500 text-sm mb-3">Ruta</h3>
            <div className="space-y-2">
              {ficha.destinos.map((destino, index) => (
                <div key={destino.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs mt-0.5">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-black text-sm">
                        {getEstadoLabel(destino.estado)} • {getCiudadLabel(destino.estado, destino.ciudad)}
                      </p>
                      {destino.comentario && (
                        <p className="text-gray-500 text-xs mt-1">{destino.comentario}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
        <div className="max-w-[360px] mx-auto">
          {ficha.estado === 'completada' ? (
            <Button
              className="w-full h-12"
              onClick={handleOpenEnvioModal}
            >
              <Mail className="h-4 w-4 mr-2" />
              Enviar
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-3 bg-[rgba(0,0,0,0)]">
              <Button
                id="abrirSalidaBtn"
                variant="outline"
                className={`h-12 ${
                  ficha.estado === 'con-salida' || ficha.estado === 'completada'
                    ? 'bg-white text-gray-400'
                    : 'bg-[rgba(0,0,0,1)] text-[rgba(255,255,255,1)]'
                }`}
                onClick={onGoToSalida}
                disabled={ficha.estado === 'con-salida' || ficha.estado === 'completada'}
              >
                Salida
              </Button>
              <Button
                id="abrirEntradaBtn"
                className={`h-12 ${
                  ficha.estado === 'creada' || ficha.estado === 'completada'
                    ? 'bg-white text-gray-400'
                    : ''
                }`}
                onClick={onGoToEntrada}
                disabled={ficha.estado === 'creada' || ficha.estado === 'completada'}
              >
                {ficha.estado === 'completada' ? 'Entrada completada' : 'Entrada'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalles de Entrada */}
      {showEntradaModal && (
        <Dialog open={showEntradaModal} onOpenChange={setShowEntradaModal}>
          <DialogContent className="max-w-[340px] rounded-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles de Entrada</DialogTitle>
              <DialogDescription>
                Información completa del registro de entrada del vehículo
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Información básica */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Fecha</p>
                  <p className="text-black">{ficha.entradaData?.fechaEntrada}</p>
                </div>
                <div>
                  <p className="text-gray-500">Hora</p>
                  <p className="text-black">{ficha.entradaData?.horaEntrada}</p>
                </div>
                <div>
                  <p className="text-gray-500">Kilometraje</p>
                  <p className="text-black">{ficha.entradaData?.kmEntrada} km</p>
                </div>
                <div>
                  <p className="text-gray-500">Combustible</p>
                  <p className="text-black">{ficha.entradaData?.combustible || 'N/A'}</p>
                </div>
              </div>

              {/* Evidencia fotográfica */}
              {ficha.entradaData?.fotos && (
                <div className="border-t pt-4">
                  <h4 className="text-sm mb-3">Evidencia fotográfica</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(ficha.entradaData.fotos).map(([key, value]) => (
                      <div 
                        key={key} 
                        className="bg-gray-100 rounded-lg p-3 aspect-square flex flex-col items-center justify-center text-center border border-gray-300 cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => handleImageClick(key, true)}
                      >
                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center mb-2">
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-xs text-gray-700">{getImageDisplayName(key)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidencias internas */}
              {ficha.entradaData?.evidenciasInternas && (
                <div className="border-t pt-4">
                  <h4 className="text-sm mb-3">Evidencias internas</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(ficha.entradaData.evidenciasInternas).map(([key, evidence]: [string, any]) => (
                      <div 
                        key={key}
                        className="bg-blue-50 rounded-lg p-3 border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                        onClick={() => evidence.foto && handleImageClick(key, true)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Eye className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-xs text-blue-700">{evidence.tipo}</span>
                        </div>
                        <p className="text-xs text-gray-600">{evidence.descripcion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Firmas */}
              <div className="border-t pt-4">
                <h4 className="text-sm mb-3">Firmas registradas</h4>
                <div className="space-y-3">
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700">Firma del conductor</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{ficha.conductorNombre}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700">Firma de quien aprueba</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Supervisor autorizado</p>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Detalles de Salida */}
      {showSalidaModal && (
        <Dialog open={showSalidaModal} onOpenChange={setShowSalidaModal}>
          <DialogContent className="max-w-[340px] rounded-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles de Salida</DialogTitle>
              <DialogDescription>
                Información completa del registro de salida del vehículo
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Información básica */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Fecha</p>
                  <p className="text-black">{ficha.salidaData?.fechaSalida}</p>
                </div>
                <div>
                  <p className="text-gray-500">Hora</p>
                  <p className="text-black">{ficha.salidaData?.horaSalida}</p>
                </div>
                <div>
                  <p className="text-gray-500">Kilometraje</p>
                  <p className="text-black">{ficha.salidaData?.kmSalida} km</p>
                </div>
                <div>
                  <p className="text-gray-500">Combustible</p>
                  <p className="text-black">{ficha.salidaData?.combustible || 'N/A'}</p>
                </div>
              </div>

              {/* Evidencia fotográfica */}
              {ficha.salidaData?.fotos && (
                <div className="border-t pt-4">
                  <h4 className="text-sm mb-3">Evidencia fotográfica</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(ficha.salidaData.fotos).map(([key, value]) => (
                      <div 
                        key={key} 
                        className="bg-gray-100 rounded-lg p-3 aspect-square flex flex-col items-center justify-center text-center border border-gray-300 cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => handleImageClick(key, false)}
                      >
                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center mb-2">
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-xs text-gray-700">{getImageDisplayName(key)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidencias internas */}
              {ficha.salidaData?.evidenciasInternas && (
                <div className="border-t pt-4">
                  <h4 className="text-sm mb-3">Evidencias internas</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(ficha.salidaData.evidenciasInternas).map(([key, evidence]: [string, any]) => (
                      <div 
                        key={key}
                        className="bg-orange-50 rounded-lg p-3 border border-orange-200 cursor-pointer hover:bg-orange-100 transition-colors"
                        onClick={() => evidence.foto && handleImageClick(key, false)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                            <Eye className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-xs text-orange-700">{evidence.tipo}</span>
                        </div>
                        <p className="text-xs text-gray-600">{evidence.descripcion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Firmas */}
              <div className="border-t pt-4">
                <h4 className="text-sm mb-3">Firmas registradas</h4>
                <div className="space-y-3">
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-orange-700">Firma del conductor</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{ficha.conductorNombre}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-orange-700">Firma de quien aprueba</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Supervisor autorizado</p>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Imagen Ampliada */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-[340px] rounded-lg p-0">
            <DialogHeader>
              <VisuallyHidden>
                <DialogTitle>Imagen ampliada</DialogTitle>
              </VisuallyHidden>
              <VisuallyHidden>
                <DialogDescription>
                  Vista ampliada de la evidencia fotográfica capturada
                </DialogDescription>
              </VisuallyHidden>
            </DialogHeader>
            <div className="relative">
              <div className="bg-gray-100 rounded-lg aspect-square flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <Eye className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-gray-700">Imagen capturada</p>
                  <p className="text-gray-500 text-sm mt-2">Vista previa de la evidencia fotográfica</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}



      {/* Modal de Envío */}
      {showEnvioModal && (
        <Dialog open={showEnvioModal} onOpenChange={setShowEnvioModal}>
          <DialogContent className="max-w-[340px] rounded-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Enviar a
              </DialogTitle>
              <DialogDescription>
                Se enviará un PDF completo de la ficha con toda la información registrada
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Información de la ficha */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Ficha a enviar</p>
                  <p className="text-black">{ficha.folio}</p>
                  <p className="text-gray-500 text-sm">{ficha.conductorNombre} • {ficha.conductorCargo}</p>
                </div>
              </div>

              {/* Campo de email */}
              <div className="space-y-2">
                <Label htmlFor="emailDestino">Email de destino *</Label>
                <Input
                  id="emailDestino"
                  type="email"
                  value={emailDestino}
                  onChange={(e) => setEmailDestino(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowEnvioModal(false);
                    setEmailDestino('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleEnviarFicha}
                  disabled={!emailDestino.trim()}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Visor de galería de fotos */}
      <PhotoGalleryViewer
        photos={(() => {
          const photos = [];
          const data = galleryViewer.isEntrada ? ficha.entradaData : ficha.salidaData;
          
          if (data?.fotos) {
            if (data.fotos.fotoKilometraje) {
              photos.push({
                id: 'fotoKilometraje',
                url: data.fotos.fotoKilometraje,
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
              if (data.fotos[foto.key]) {
                photos.push({
                  id: foto.key,
                  url: data.fotos[foto.key],
                  label: foto.label
                });
              }
            });
          }
          
          if (data?.fotosInteriores && Array.isArray(data.fotosInteriores)) {
            data.fotosInteriores.forEach((foto: any) => {
              if (foto.foto) {
                photos.push({
                  id: foto.id,
                  url: foto.foto,
                  label: foto.tipo
                });
              }
            });
          }
          
          if (data?.evidenciasInternas) {
            Object.entries(data.evidenciasInternas).forEach(([key, evidence]: [string, any]) => {
              if (evidence.foto) {
                photos.push({
                  id: key,
                  url: evidence.foto,
                  label: evidence.tipo
                });
              }
            });
          }
          
          return photos;
        })()}
        initialIndex={galleryViewer.initialIndex}
        open={galleryViewer.open}
        onOpenChange={(open) => setGalleryViewer({ ...galleryViewer, open })}
      />
    </div>
  );
}