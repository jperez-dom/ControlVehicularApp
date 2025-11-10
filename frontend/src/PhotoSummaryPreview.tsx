import React from 'react';
import { Camera } from 'lucide-react';

// Datos de ejemplo para la previsualización
const mockEntradaData = {
  fotoKilometraje: true,
  fotoFrontal: true,
  fotoLatDer: true,
  fotoLatIzq: true,
  fotoPosterior: true,
  fotosInteriores: [
    { id: '1', label: 'Asientos delanteros', file: true },
    { id: '2', label: 'Guantera', file: true },
    { id: '3', label: 'Asientos traseros', file: null }
  ]
};

function getTotalFotos() {
  let total = 0;
  if (mockEntradaData.fotoKilometraje) total++;
  if (mockEntradaData.fotoFrontal) total++;
  if (mockEntradaData.fotoLatDer) total++;
  if (mockEntradaData.fotoLatIzq) total++;
  if (mockEntradaData.fotoPosterior) total++;
  total += mockEntradaData.fotosInteriores.filter(f => f.file).length;
  return total;
}

export default function PhotoSummaryPreview() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-[360px] mx-auto">
        <h1 className="text-xl font-medium text-black mb-6 text-center">
          Previsualización: Evidencia Fotográfica
        </h1>
        
        {/* Sección de Evidencia Fotográfica - igual que en ResumenEntrada */}
        <div className="bg-white rounded-lg p-4">
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Camera className="h-4 w-4 text-gray-500" />
              <p className="text-gray-500 text-sm">Evidencia fotográfica</p>
            </div>
            
            {/* Esta es la sección exacta que seleccionaste */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-700 text-sm font-medium">
                ✓ {getTotalFotos()} fotos capturadas
              </p>
              <div className="text-xs text-green-600 mt-1 space-y-1">
                {mockEntradaData.fotoKilometraje && <p>• Foto del kilometraje</p>}
                {mockEntradaData.fotoFrontal && <p>• Vista frontal</p>}
                {mockEntradaData.fotoLatDer && <p>• Vista lateral derecha</p>}
                {mockEntradaData.fotoLatIzq && <p>• Vista lateral izquierda</p>}
                {mockEntradaData.fotoPosterior && <p>• Vista posterior</p>}
                {mockEntradaData.fotosInteriores.filter(f => f.file).length > 0 && 
                  <p>• {mockEntradaData.fotosInteriores.filter(f => f.file).length} foto(s) interior(es)</p>
                }
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 bg-white rounded-lg p-4">
          <h2 className="text-lg font-medium text-black mb-3">Detalles de la sección</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Fondo:</strong> Verde claro (bg-green-50)</p>
            <p><strong>Borde:</strong> Verde (border-green-200)</p>
            <p><strong>Texto principal:</strong> Verde oscuro (text-green-700)</p>
            <p><strong>Lista de fotos:</strong> Verde medio (text-green-600)</p>
            <p><strong>Total de fotos:</strong> {getTotalFotos()}</p>
          </div>
        </div>

        {/* Variaciones de ejemplo */}
        <div className="mt-6 space-y-4">
          <h2 className="text-lg font-medium text-black">Variaciones de ejemplo</h2>
          
          {/* Con menos fotos */}
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Camera className="h-4 w-4 text-gray-500" />
              <p className="text-gray-500 text-sm">Solo fotos principales</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-700 text-sm font-medium">
                ✓ 3 fotos capturadas
              </p>
              <div className="text-xs text-green-600 mt-1 space-y-1">
                <p>• Foto del kilometraje</p>
                <p>• Vista frontal</p>
                <p>• Vista posterior</p>
              </div>
            </div>
          </div>

          {/* Sin fotos interiores */}
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Camera className="h-4 w-4 text-gray-500" />
              <p className="text-gray-500 text-sm">Solo exteriores</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-700 text-sm font-medium">
                ✓ 5 fotos capturadas
              </p>
              <div className="text-xs text-green-600 mt-1 space-y-1">
                <p>• Foto del kilometraje</p>
                <p>• Vista frontal</p>
                <p>• Vista lateral derecha</p>
                <p>• Vista lateral izquierda</p>
                <p>• Vista posterior</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}