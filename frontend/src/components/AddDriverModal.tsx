import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { X } from 'lucide-react';

interface Driver {
  value: string;
  label: string;
  cargo?: string;
}

interface AddDriverModalProps {
  id?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDriverAdded: (driver: Driver) => void;
}

export function AddDriverModal({ id, open, onOpenChange, onDriverAdded }: AddDriverModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    cargo: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim() || !formData.apellidos.trim()) {
      return;
    }

    const fullName = `${formData.nombre} ${formData.apellidos}`.trim();
    const driverValue = fullName.toLowerCase().replace(/\s+/g, '-');
    
    const newDriver: Driver = {
      value: driverValue,
      label: fullName,
      cargo: formData.cargo
    };

    onDriverAdded(newDriver);
    
    // Reset form
    setFormData({
      nombre: '',
      apellidos: '',
      cargo: ''
    });
    
    onOpenChange(false);
  };

  const handleCancel = () => {
    setFormData({
      nombre: '',
      apellidos: '',
      cargo: ''
    });
    onOpenChange(false);
  };

  const isFormValid = formData.nombre.trim() && formData.apellidos.trim();

  return (
    open && (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Nuevo conductor</DialogTitle>
          </div>
          <DialogDescription>
            Agrega un nuevo conductor al sistema
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Nombre del conductor"
              className="mt-1"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="apellidos">Apellidos *</Label>
            <Input
              id="apellidos"
              value={formData.apellidos}
              onChange={(e) => setFormData(prev => ({ ...prev, apellidos: e.target.value }))}
              placeholder="Apellidos del conductor"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="cargo">Cargo</Label>
            <Input
              id="cargo"
              value={formData.cargo}
              onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
              placeholder="Ej: Chofer, Técnico, etc."
              className="mt-1"
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