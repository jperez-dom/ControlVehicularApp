import React, { useState } from 'react';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarPickerProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}

export function CalendarPicker({
  value,
  onValueChange,
  placeholder,
  disabled = false
}: CalendarPickerProps) {
  const [open, setOpen] = useState(false);

  const formatDisplayDate = (date: string) => {
    try {
      // Crear fecha local para evitar problemas de zona horaria
      const [year, month, day] = date.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      return format(localDate, 'dd/MM/yyyy', { locale: es });
    } catch {
      return '';
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Usar fecha local sin conversión UTC para evitar cambio de día
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const localDateString = `${year}-${month}-${day}`;
      onValueChange(localDateString);
      setOpen(false);
    }
  };

  // Crear fecha local para evitar problemas de zona horaria
  const selectedDate = value ? (() => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day); // month - 1 porque Date usa índices 0-11
  })() : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between h-12 font-normal"
          disabled={disabled}
        >
          <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
            {value ? formatDisplayDate(value) : placeholder}
          </span>
          <CalendarIcon className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0" 
        align="start"
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          defaultMonth={selectedDate || new Date()}
          initialFocus
          locale={es}
        />
      </PopoverContent>
    </Popover>
  );
}