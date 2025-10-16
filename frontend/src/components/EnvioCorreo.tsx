import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toast } from "sonner";
import { Check, FileText, Send, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import grupoOptimoLogo from 'figma:asset/220b05f22fbef50eaf6e2085eb40125dfd99d55b.png';

interface Destino {
  id: string;
  estado: string;
  ciudad: string;
  comentario: string;
}

interface EnvioCorreoProps {
  folio: string;
  conductor: string;
  onBack: () => void;
  onComplete: () => void;
  comisionData: {
    destinos: Destino[];
    fechaSalida: string;
    fechaEntrega: string;
    horaEntrega: string;
    vehiculo: string;
  };
}

export function EnvioCorreo({ folio, conductor, onBack, onComplete, comisionData }: EnvioCorreoProps) {
  const [isEnviando, setIsEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    // Auto-iniciar el proceso de envío
    handleEnviar();
  }, []);

  const handleEnviar = async () => {
    setIsEnviando(true);

    // Simulate sending email
    await new Promise(resolve => setTimeout(resolve, 3000));

    setIsEnviando(false);
    setEnviado(true);
    toast.success('Reporte enviado y archivado exitosamente');

    // Auto-complete after showing success state
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  if (enviado) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
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

        {/* Success Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-[320px] text-center space-y-6"
          >
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="h-12 w-12 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-medium">¡Proceso completado!</h2>
              <p className="text-gray-600">
                El reporte de la comisión {folio} ha sido enviado y archivado exitosamente
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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

      {/* Loading Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-[320px] text-center space-y-6"
        >
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Send className="h-12 w-12 text-blue-600" />
            </motion.div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-medium">Enviando reporte...</h2>
            <p className="text-gray-600">
              Procesando y enviando el reporte de la comisión {folio}
            </p>
            
            <Card className="p-4 bg-gray-50 text-left">
              <h3 className="font-medium mb-3 text-center">Archivos incluidos:</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <motion.div 
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Reporte de comisión (PDF)</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Fotos del vehículo (4 imágenes)</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                >
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Fotos del interior</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2 }}
                >
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Imagen del odómetro</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.5 }}
                >
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Firmas digitales</span>
                </motion.div>
              </div>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}