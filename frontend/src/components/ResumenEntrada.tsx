import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { motion } from 'motion/react';
import { ArrowLeft, Send, User, Car, MapPin, Clock, Gauge, Camera, FileText } from 'lucide-react';
import { toast } from "sonner";
import grupoOptimoLogo from 'figma:asset/220b05f22fbef50eaf6e2085eb40125dfd99d55b.png';

interface Destino {
  id: string;
  estado: string;
  ciudad: string;
  comentario: string;
}

interface ComisionData {
  destinos: Destino[];
  fechaSalida: string;
  fechaEntrega: string;
  horaEntrega: string;
  vehiculo: string;
}

interface FotoInterior {
  id: string;
  label: string;
  file: File | null;
}

interface RegistroEntradaData {
  kmEntrada: string;
  fotoKilometraje: File | null;
  combustible: number;
  fotoFrontal: File | null;
  fotoLatDer: File | null;
  fotoLatIzq: File | null;
  fotoPosterior: File | null;
  fotosInteriores: FotoInterior[];
  firmaConductor: string;
  firmaAprobador: string;
}

interface ResumenEntradaProps {
  folio: string;
  conductor: string;
  horaSalida: string;
  onBack: () => void;
  onSendToEmail: (email: string) => void;
  comisionData: ComisionData;
  entradaData: RegistroEntradaData;
}

export function ResumenEntrada({ 
  folio, 
  conductor, 
  horaSalida, 
  onBack, 
  onSendToEmail, 
  comisionData, 
  entradaData 
}: ResumenEntradaProps) {
  const [destinatario, setDestinatario] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSend = () => {
    if (!destinatario.trim()) {
      setEmailError('Ingresa el correo del destinatario');
      return;
    }
    
    if (!validateEmail(destinatario)) {
      setEmailError('Ingresa un correo válido');
      return;
    }
    
    setEmailError('');
    
    // Crear el resumen completo con todos los datos
    const resumenCompleto = {
      folio: folio,
      conductor: conductor,
      vehiculo: comisionData.vehiculo,
      fechaSalida: comisionData.fechaSalida,
      horaSalida: horaSalida,
      fechaEntrega: comisionData.fechaEntrega,
      horaEntrega: comisionData.horaEntrega,
      destinos: comisionData.destinos,
      kilometraje: entradaData.kmEntrada,
      combustible: getFuelText(entradaData.combustible),
      combustibleValor: entradaData.combustible,
      totalFotos: getTotalFotos(),
      fechaRegistro: new Date().toLocaleDateString('es-MX'),
      horaRegistro: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      destinatario: destinatario
    };
    
    // Simular envío de correo con toda la información
    console.log('📧 ENVIANDO CORREO ELECTRÓNICO:', {
      to: destinatario,
      subject: `Resumen de Comisión - Folio ${folio}`,
      data: resumenCompleto
    });
    
    // Toast de éxito más detallado
    toast.success(`Resumen enviado correctamente a ${destinatario}`, {
      description: `Folio ${folio} - Combustible: ${getFuelText(entradaData.combustible)} - ${getTotalFotos()} fotos adjuntas`
    });
    
    // Pequeño delay para mostrar el toast antes de continuar
    setTimeout(() => {
      onSendToEmail(destinatario);
    }, 1000);
  };

  const getFuelText = (level: number) => {
    // Mapear valores específicos del selector: 0, 25, 75, 100
    const fuelMap: { [key: number]: string } = {
      0: 'Vacío',
      25: '1/4',
      75: '3/4', 
      100: 'Lleno'
    };
    
    // Asegurar que level es un número válido
    if (level === null || level === undefined || isNaN(level)) {
      return 'No especificado';
    }
    
    // Convertir a entero por si viene como string
    const levelInt = parseInt(level.toString(), 10);
    
    // Buscar el valor en el mapa
    return fuelMap[levelInt] || 'No especificado';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getTotalFotos = () => {
    let total = 0;
    if (entradaData.fotoKilometraje) total++;
    if (entradaData.fotoFrontal) total++;
    if (entradaData.fotoLatDer) total++;
    if (entradaData.fotoLatIzq) total++;
    if (entradaData.fotoPosterior) total++;
    total += entradaData.fotosInteriores.filter(f => f.file).length;
    return total;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Safe Area Top */}
      <div className="h-12 bg-black"></div>
      
      {/* Header */}
      <div className="bg-black px-[16px] py-[5px]">
        <div className="flex items-center justify-center">
          <img 
            src={grupoOptimoLogo} 
            alt="GRUPO OPTIMO" 
            className="h-12 w-auto object-contain px-[54px] py-[0px]"
          />
        </div>
      </div>

      {/* Title and Back */}
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-black">Resumen de entrada</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[360px] mx-auto px-4 py-6 pb-32 space-y-6">
        
        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-black">Información General</h2>
                <span className="text-sm text-gray-500">Folio: {folio}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-gray-500">Conductor</p>
                    <p className="text-black">{conductor}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-gray-500">Vehículo</p>
                    <p className="text-black">{comisionData.vehiculo}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-gray-500">Salida</p>
                    <p className="text-black">{formatDate(comisionData.fechaSalida)}</p>
                    <p className="text-gray-400 text-xs">{horaSalida}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-gray-500">Destinos</p>
                    <p className="text-black">{comisionData.destinos.length} parada{comisionData.destinos.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Datos de Entrada */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          <Card className="p-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-black">Datos de Entrada</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-gray-500 text-sm">Kilometraje</p>
                    <p className="text-black">{entradaData.kmEntrada} km</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-gray-500 text-sm">Combustible</p>
                    <p className="text-black">{getFuelText(entradaData.combustible)}</p>
                  </div>
                </div>
              </div>

              {/* Evidencia Fotográfica */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="h-4 w-4 text-gray-500" />
                  <p className="text-gray-500 text-sm">Evidencia fotográfica</p>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-700 text-sm font-medium">
                    ✓ {getTotalFotos()} fotos capturadas
                  </p>
                  <div className="text-sm text-green-600 mt-1 space-y-2">
                    {entradaData.fotoKilometraje && (
                      <button 
                        className="text-left w-full hover:text-green-700 transition-colors group flex items-center gap-2"
                        onClick={() => toast.success('Mostrando foto del kilometraje', { description: 'Foto capturada exitosamente' })}
                      >
                        <Camera className="h-4 w-4 flex-shrink-0" />
                        <span className="group-hover:underline">Foto del kilometraje</span>
                      </button>
                    )}
                    {entradaData.fotoFrontal && (
                      <button 
                        className="text-left w-full hover:text-green-700 transition-colors group flex items-center gap-2"
                        onClick={() => toast.success('Mostrando vista frontal', { description: 'Foto del frente del vehículo' })}
                      >
                        <Camera className="h-4 w-4 flex-shrink-0" />
                        <span className="group-hover:underline">Vista frontal</span>
                      </button>
                    )}
                    {entradaData.fotoLatDer && (
                      <button 
                        className="text-left w-full hover:text-green-700 transition-colors group flex items-center gap-2"
                        onClick={() => toast.success('Mostrando vista lateral derecha', { description: 'Foto del lado derecho del vehículo' })}
                      >
                        <Camera className="h-4 w-4 flex-shrink-0" />
                        <span className="group-hover:underline">Vista lateral derecha</span>
                      </button>
                    )}
                    {entradaData.fotoLatIzq && (
                      <button 
                        className="text-left w-full hover:text-green-700 transition-colors group flex items-center gap-2"
                        onClick={() => toast.success('Mostrando vista lateral izquierda', { description: 'Foto del lado izquierdo del vehículo' })}
                      >
                        <Camera className="h-4 w-4 flex-shrink-0" />
                        <span className="group-hover:underline">Vista lateral izquierda</span>
                      </button>
                    )}
                    {entradaData.fotoPosterior && (
                      <button 
                        className="text-left w-full hover:text-green-700 transition-colors group flex items-center gap-2"
                        onClick={() => toast.success('Mostrando vista posterior', { description: 'Foto de la parte trasera del vehículo' })}
                      >
                        <Camera className="h-4 w-4 flex-shrink-0" />
                        <span className="group-hover:underline">Vista posterior</span>
                      </button>
                    )}
                    {entradaData.fotosInteriores.filter(f => f.file).length > 0 && (
                      <button 
                        className="text-left w-full hover:text-green-700 transition-colors group flex items-center gap-2"
                        onClick={() => toast.success(`Mostrando ${entradaData.fotosInteriores.filter(f => f.file).length} foto(s) interior(es)`, { description: 'Fotos del interior del vehículo' })}
                      >
                        <Camera className="h-4 w-4 flex-shrink-0" />
                        <span className="group-hover:underline">{entradaData.fotosInteriores.filter(f => f.file).length} foto(s) interior(es)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Firmas */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <p className="text-gray-500 text-sm">Firmas digitales</p>
                </div>
                
                <div className="space-y-2">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                    <p className="text-green-700 text-sm">✓ Firma del conductor</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                    <p className="text-green-700 text-sm">✓ Firma de quien aprueba</p>
                  </div>
                </div>
              </div>

              {/* Fecha y hora de registro */}
              <div className="border-t pt-4 text-center">
                <p className="text-gray-500 text-sm">Registro completado</p>
                <p className="text-gray-600 text-sm">
                  {new Date().toLocaleDateString('es-MX')} - {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Campo de Destinatario */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          <Card className="p-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-black">Enviar resumen</h3>
              
              <div>
                <Label htmlFor="destinatario" className={emailError ? "text-destructive" : ""}>
                  Correo del destinatario *
                </Label>
                <Input
                  id="destinatario"
                  type="email"
                  value={destinatario}
                  onChange={(e) => {
                    setDestinatario(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  placeholder="ejemplo@empresa.com"
                  className={`mt-2 ${emailError ? 'border-destructive' : ''}`}
                />
                {emailError && (
                  <p className="text-destructive text-sm mt-1">{emailError}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  El resumen completo será enviado a este correo electrónico
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
        <div className="max-w-[360px] mx-auto space-y-3">
          <Button
            className="w-full h-12"
            onClick={handleSend}
            disabled={!destinatario.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar resumen y archivar
          </Button>
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={onBack}
          >
            Volver a editar
          </Button>
        </div>
      </div>
    </div>
  );
}