import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';
import { driversAPI } from '../api';
import { toast } from "sonner";

interface Driver {
  id: number;
  value: string;
  label: string;
  cargo?: string;
}

interface DeleteDriverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drivers: Driver[];
  onDriverDeleted: (driverId: number) => void;
}

export function DeleteDriverModal({ open, onOpenChange, drivers, onDriverDeleted }: DeleteDriverModalProps) {

  const handleDelete = async (driverId: number) => {
    if (!driverId) return;

    try {
      await driversAPI.delete(driverId);
      onDriverDeleted(driverId);
      toast.success('Conductor eliminado');
    } catch (error) {
      console.error('Error al eliminar conductor:', error);
      toast.error('Error al eliminar el conductor');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Eliminar Conductor</DialogTitle>
          <DialogDescription>
            Selecciona el conductor que deseas eliminar. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 modal-scroll-content pr-2 space-y-2">
          {drivers.map(driver => (
            <div key={driver.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
              <div>
                <p className="font-medium">{driver.label}</p>
                <p className="text-sm text-gray-500">{driver.cargo}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(driver.id!)}>
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
