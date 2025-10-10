import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { X } from 'lucide-react';

interface Vehicle {
  value: string;
  label: string;
  marca?: string;
  modelo?: string;
  color?: string;
  año?: string;
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
    color: '',
    año: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.marca.trim() || !formData.modelo.trim()) {
      return;
    }

    const vehicleName = `${formData.marca} ${formData.modelo}`.trim();
    const vehicleValue = vehicleName.toLowerCase().replace(/\s+/g, '-');
    
    const newVehicle: Vehicle = {
      value: vehicleValue,
      label: vehicleName,
      marca: formData.marca,
      modelo: formData.modelo,
      color: formData.color,
      año: formData.año
    };

    onVehicleAdded(newVehicle);
    
    // Reset form
    setFormData({
      marca: '',
      modelo: '',
      color: '',
      año: ''
    });
    
    onOpenChange(false);
  };

  const handleCancel = () => {
    setFormData({
      marca: '',
      modelo: '',
      color: '',
      año: ''
    });
    onOpenChange(false);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setFormData(prev => ({ ...prev, año: value }));
  };

  const isFormValid = formData.marca.trim() && formData.modelo.trim();

  return (
    open && (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Nuevo vehículo</DialogTitle>
          </div>
          <DialogDescription>
            Agrega un nuevo vehículo al sistema
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="marca">Marca *</Label>
            <Input
              id="marca"
              value={formData.marca}
              onChange={(e) => setFormData(prev => ({ ...prev, marca: e.target.value }))}
              placeholder="Ej: Toyota, Ford, Nissan"
              className="mt-1"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="modelo">Modelo *</Label>
            <Input
              id="modelo"
              value={formData.modelo}
              onChange={(e) => setFormData(prev => ({ ...prev, modelo: e.target.value }))}
              placeholder="Ej: Hilux, F-150, Sentra"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="color">Color</Label>
            <Input
              id="color"
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              placeholder="Ej: Blanco, Rojo, Azul"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="año">Año</Label>
            <Input
              id="año"
              value={formData.año}
              onChange={handleYearChange}
              placeholder="Ej: 2023"
              className="mt-1"
              maxLength={4}
              inputMode="numeric"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid}
              className="flex-1"
            >
              Guardar
            </Button>
          </div>
          </form>
        </DialogContent>
      </Dialog>
    )
  );
}