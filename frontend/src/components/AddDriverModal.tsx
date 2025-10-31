import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { X } from 'lucide-react';
import { driversAPI } from '../api';
import { toast } from "sonner";

interface Driver {
  value: string;
  label: string;
  cargo?: string;
  id?: number;
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
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim() || !formData.apellidos.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      const fullName = `${formData.nombre} ${formData.apellidos}`.trim();

      // Guardar en la BD
      const response = await driversAPI.create({
        name: fullName,
        position: formData.cargo || 'Sin cargo',
        phone: '',
        email: ''
      });

      if (response.data.success) {
        const driverValue = fullName.toLowerCase().replace(/\s+/g, '-');

        const newDriver: Driver = {
          id: response.data.driver.id,
          value: driverValue,
          label: fullName,
          cargo: formData.cargo
        };

        onDriverAdded(newDriver);
        toast.success('Conductor guardado en la base de datos');

        // Reset form
        setFormData({
          nombre: '',
          apellidos: '',
          cargo: ''
        });

        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error al crear conductor:', error);
      toast.error('Error al guardar el conductor');
    } finally {
      setIsLoading(false);
    }
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
      <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
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
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="flex-1"
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
          </form>
        </DialogContent>
      </Dialog>
    )
  );
}