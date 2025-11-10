import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { vehiclesAPI } from '../api';
import { toast } from "sonner";

interface Vehicle {
  value: string;
  label: string;
  marca?: string;
  modelo?: string;
  color?: string;
  año?: string;
  id: number;
  placa?: string;
}

interface AddVehicleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVehicleAdded: (vehicle: Vehicle) => void;
}

export function AddVehicleModal({ open, onOpenChange, onVehicleAdded }: AddVehicleModalProps) {
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    plate: '',
    color: '',
    año: '',
    internal_number: ''
  });
  const [errors, setErrors] = useState({
    marca: false,
    modelo: false,
    plate: false,
  });

  useEffect(() => {
    if (open) {
      setFormData({
        marca: '',
        modelo: '',
        plate: '',
        año: '',
        color: '',
        internal_number: ''
      });
      setErrors({ marca: false, modelo: false, plate: false });
    }
  }, [open]);

  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const newErrors = {
      marca: !formData.marca.trim(),
      modelo: !formData.modelo.trim(),
      plate: !formData.plate.trim(),
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };


  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      const payload = {
        brand: formData.marca,
        model: formData.modelo,
        plate: formData.plate,
        year: formData.año ? parseInt(formData.año) : undefined,
        color: formData.color || undefined,
        internal_number: formData.internal_number ? parseInt(formData.internal_number) : undefined,
      };
      
      const response = await vehiclesAPI.create({
        ...payload
      });

      const newVehicle: Vehicle = {
        id: response.data.id,
        value: response.data.plate,
        label: `${response.data.brand} ${response.data.model} (${response.data.plate})`,
        placa: response.data.plate,
      };

      onVehicleAdded(newVehicle);
      toast.success('Vehículo agregado correctamente');
      onOpenChange(false);
    } catch (error) {
      console.error('Error al guardar vehículo:', error);
      toast.error('Error al guardar el vehículo');
    }
  };

  return (
    open && (
      <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
        <DialogContent className="max-w-[360px] mx-auto p-0">
        <DialogHeader>
          <DialogTitle>Añadir Vehículo</DialogTitle>
          <DialogDescription>
            Ingresa los detalles del nuevo vehículo.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 space-y-4 modal-scroll-content">
          <div>
            <Label className={errors.marca ? "text-destructive" : ""}>Marca *</Label>
            <Input
              id="marca"
              value={formData.marca}
              onChange={(e) => updateFormData('marca', e.target.value)}
              placeholder="Ej. Nissan"
              className="mt-1"
            />
            {errors.marca && <p className="text-destructive text-sm mt-1">Este campo es obligatorio</p>}
          </div>

          <div>
            <Label className={errors.modelo ? "text-destructive" : ""}>Modelo *</Label>
            <Input
              id="modelo"
              value={formData.modelo}
              onChange={(e) => updateFormData('modelo', e.target.value)}
              placeholder="Ej. Versa"
              className="mt-1"
            />
            {errors.modelo && <p className="text-destructive text-sm mt-1">Este campo es obligatorio</p>}
          </div>
          <div>
            <Label className={errors.plate ? "text-destructive" : ""}>Placa *</Label>
            <Input id="plate" value={formData.plate} onChange={(e) => updateFormData('plate', e.target.value)} placeholder="Ej. ABC-123-D" className="mt-1" />
            {errors.plate && <p className="text-destructive text-sm mt-1">Este campo es obligatorio</p>}
          </div>

          <div>
            <Label>Año</Label>
            <Input
              id="año"
              type="number"
              value={formData.año}
              onChange={(e) => updateFormData('año', e.target.value)}
              placeholder="Ej. 2023"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Color</Label>
            <Input
              id="color"
              value={formData.color}
              onChange={(e) => updateFormData('color', e.target.value)}
              placeholder="Ej. Blanco"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Número Interno</Label>
            <Input id="internal_number" type="number" value={formData.internal_number} onChange={(e) => updateFormData('internal_number', e.target.value)} placeholder="Ej. 101" className="mt-1" />
          </div>
        </div>

        <div className="p-4 pt-0 flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancelar</Button>
          <Button onClick={handleSave} className="flex-1">Guardar</Button>
        </div>
        </DialogContent>
      </Dialog>
    )
  );
}