import React from 'react';
import { Button } from './ui/button';
import { Edit2, Trash2 } from 'lucide-react';

interface Destino {
  id: string;
  estado: string;
  ciudad: string;
  comentario: string;
}

interface DestinosListProps {
  id?: string;
  destinos: Destino[];
  onEditDestino: (destino: Destino) => void;
  onDeleteDestino: (id: string) => void;
  getEstadoLabel: (value: string) => string;
  getCiudadLabel: (estadoValue: string, ciudadValue: string) => string;
}

export function DestinosList({ 
  id,
  destinos, 
  onEditDestino, 
  onDeleteDestino, 
  getEstadoLabel,
  getCiudadLabel 
}: DestinosListProps) {
  if (destinos.length === 0) {
    return null;
  }

  return (
    <div id={id || "destinosList"} className="space-y-3">
      <h3 className="font-medium">Destinos</h3>
      <div className="space-y-2">
        {destinos.map((destino) => (
          <div
            key={destino.id}
            id="destinoItem"
            className="bg-[rgba(236,236,236,1)] rounded-lg p-3 space-y-2"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">
                  {getEstadoLabel(destino.estado)} • {getCiudadLabel(destino.estado, destino.ciudad)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {destino.comentario}
                </p>
              </div>
              
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  id="editDestinoBtn"
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditDestino(destino)}
                  className="h-8 w-8 p-0"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  id="deleteDestinoBtn"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteDestino(destino.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}