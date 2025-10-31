import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';
import { vehiclesAPI } from '../api';
import { toast } from "sonner";

interface Vehicle {
  id: number;
  value: string;
  label: string;
}

interface DeleteVehicleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: Vehicle[];
  onVehicleDeleted: (vehicleId: number) => void;
}

export function DeleteVehicleModal({ open, onOpenChange, vehicles, onVehicleDeleted }: DeleteVehicleModalProps) {

  const handleDelete = async (vehicleId: number) => {
    if (!vehicleId) return;

    try {
      await vehiclesAPI.delete(vehicleId);
      onVehicleDeleted(vehicleId);
      toast.success('Vehículo eliminado');
    } catch (error) {
      console.error('Error al eliminar vehículo:', error);
      toast.error('Error al eliminar el vehículo');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Eliminar Vehículo</DialogTitle>
          <DialogDescription>
            Selecciona el vehículo que deseas eliminar. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 modal-scroll-content pr-2 space-y-2">
          {vehicles.map(vehicle => (
            <div key={vehicle.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
              <p className="font-medium">{vehicle.label}</p>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(vehicle.id!)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
