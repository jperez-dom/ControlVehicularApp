import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { BottomSheetSelect } from './BottomSheet';
import { X } from 'lucide-react';
import { toast } from "sonner";

interface Destino {
  id: string;
  estado: string;
  ciudad: string;
  comentario: string;
}

interface AddDestinoModalProps {
  id?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDestinoAdded: (destino: Destino) => void;
  editingDestino?: Destino | null;
  estados: Array<{ value: string; label: string; codigo?: string; }>;
  ciudades: Record<string, Array<{ value: string; label: string; }>>;
  loadCiudadesForEstado: (estadoValue: string, estadoLabel: string) => Promise<void>;
  loadingCiudades: Record<string, boolean>;
}

export function AddDestinoModal({ 
  id,
  open, 
  onOpenChange, 
  onDestinoAdded, 
  editingDestino,
  estados,
  ciudades,
  loadCiudadesForEstado,
  loadingCiudades
}: AddDestinoModalProps) {
  const [formData, setFormData] = useState({
    estado: editingDestino?.estado || '',
    ciudad: editingDestino?.ciudad || '',
    comentario: editingDestino?.comentario || ''
  });

  const [errors, setErrors] = useState({
    estado: false,
    ciudad: false,
    comentario: false
  });

  React.useEffect(() => {
    if (editingDestino) {
      setFormData({
        estado: editingDestino.estado,
        ciudad: editingDestino.ciudad,
        comentario: editingDestino.comentario
      });
    } else {
      setFormData({
        estado: '',
        ciudad: '',
        comentario: ''
      });
    }
    setErrors({
      estado: false,
      ciudad: false,
      comentario: false
    });
  }, [editingDestino, open]);

  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Reset ciudad when estado changes and load ciudades
      if (field === 'estado') {
        newData.ciudad = '';
        
        // Load ciudades for the selected estado
        if (value) {
          const selectedEstado = estados.find(e => e.value === value);
          if (selectedEstado && !ciudades[value]) {
            loadCiudadesForEstado(value, selectedEstado.label);
          }
        }
      }
      
      return newData;
    });
    
    // Clear error when user starts filling field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  const getCiudadOptions = () => {
    if (!formData.estado) return [];
    return ciudades[formData.estado] || [];
  };

  const validateForm = () => {
    const newErrors = {
      estado: !formData.estado,
      ciudad: !formData.ciudad,
      comentario: !formData.comentario.trim()
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    const destino: Destino = {
      id: editingDestino?.id || Date.now().toString(),
      estado: formData.estado,
      ciudad: formData.ciudad,
      comentario: formData.comentario.trim()
    };

    onDestinoAdded(destino);
    onOpenChange(false);
    
    if (editingDestino) {
      toast.success('Destino actualizado');
    } else {
      toast.success('Destino agregado');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    open && (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="max-w-[360px] mx-auto p-0"
          onInteractOutside={(e) => e.preventDefault()}
        >
        {/* Header */}
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle>
              {editingDestino ? 'Editar destino' : 'Añadir destino'}
            </DialogTitle>

          </div>
          <DialogDescription>
            {editingDestino ? 'Edita la información del destino' : 'Agrega un nuevo destino a la ruta'}
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Estado */}
          <div>
            <Label className={errors.estado ? "text-destructive" : ""}>
              Estado *
            </Label>
            <div className="mt-1">
              <BottomSheetSelect
                id="destinoEstado"
                options={estados}
                value={formData.estado}
                onValueChange={(value) => updateFormData('estado', value)}
                placeholder="Seleccionar estado"
              />
            </div>
            {errors.estado && (
              <p className="text-destructive text-sm mt-1">
                Este campo es obligatorio
              </p>
            )}
          </div>

          {/* Ciudad */}
          <div>
            <Label className={errors.ciudad ? "text-destructive" : ""}>
              Ciudad *
            </Label>
            <div className="mt-1">
              <BottomSheetSelect
                id="destinoCiudad"
                options={getCiudadOptions()}
                value={formData.ciudad}
                onValueChange={(value) => updateFormData('ciudad', value)}
                placeholder={
                  loadingCiudades[formData.estado] 
                    ? "Cargando ciudades..." 
                    : "Seleccionar ciudad"
                }
                disabled={!formData.estado || loadingCiudades[formData.estado]}
              />
            </div>
            {errors.ciudad && formData.estado && (
              <p className="text-destructive text-sm mt-1">
                Este campo es obligatorio
              </p>
            )}
          </div>

          {/* Comentario */}
          <div>
            <Label className={errors.comentario ? "text-destructive" : ""}>
              Comentario *
            </Label>
            <Textarea
              id="destinoComentario"
              placeholder="Escribe un comentario sobre este destino..."
              value={formData.comentario}
              onChange={(e) => updateFormData('comentario', e.target.value)}
              rows={2}
              className={`mt-1 resize-none ${errors.comentario ? 'border-destructive' : ''}`}
            />
            {errors.comentario && (
              <p className="text-destructive text-sm mt-1">
                Este campo es obligatorio
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 pt-0 flex gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1"
          >
            Guardar
          </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  );
}