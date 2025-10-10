import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Check, ChevronDown, Search } from 'lucide-react';

interface BottomSheetSelectProps {
  options: Array<{ value: string; label: string }>;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  searchable?: boolean;
  disabled?: boolean;
  trigger?: React.ReactNode;
}

export function BottomSheetSelect({
  options,
  value,
  onValueChange,
  placeholder,
  searchable = true,
  disabled = false,
  trigger
}: BottomSheetSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setOpen(false);
    setSearchQuery('');
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      className="w-full justify-between h-12"
      disabled={disabled}
    >
      <span className={selectedOption ? '' : 'text-gray-500'}>
        {selectedOption ? selectedOption.label : placeholder}
      </span>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </Button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || defaultTrigger}
      </PopoverTrigger>
      <PopoverContent 
        className="w-[--radix-popover-trigger-width] p-0" 
        align="start"
        style={{ animationDuration: '0ms', animationDelay: '0ms' }}
        sideOffset={4}
      >
        <div className="flex flex-col max-h-[400px]">
          <div className="p-3 border-b flex-shrink-0">
            <h3 className="font-medium text-sm text-foreground">{placeholder}</h3>
          </div>
          
          {searchable && (
            <div className="p-3 border-b flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
            </div>
          )}
          
          <div 
            className="overflow-y-auto flex-1" 
            style={{ 
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {filteredOptions.map((option) => (
              <button
                key={option.value}
                className="w-full px-3 py-2 text-left hover:bg-accent flex items-center justify-between transition-none"
                onClick={() => handleSelect(option.value)}
              >
                <span className="text-foreground">{option.label}</span>
                {value === option.value && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </button>
            ))}
            
            {filteredOptions.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                No se encontraron resultados
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface BottomSheetDatePickerProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  mode?: 'date' | 'time';
}

export function BottomSheetDatePicker({
  value,
  onValueChange,
  placeholder,
  disabled = false,
  mode = 'date'
}: BottomSheetDatePickerProps) {
  const [open, setOpen] = useState(false);

  const formatDisplayValue = (val: string) => {
    if (!val) return '';
    if (mode === 'date') {
      return new Date(val).toLocaleDateString('es-MX');
    } else {
      // Para time, mostrar en formato HH:MM
      return val;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange(e.target.value);
  };

  // Para modo time, usar selector de ruedas
  if (mode === 'time') {
    const currentTime = value || '12:00';
    const [hours, minutes] = currentTime.split(':').map(Number);

    const handleTimeChange = (newHours: number, newMinutes: number) => {
      const timeString = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
      onValueChange(timeString);
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-[42px] font-normal"
            disabled={disabled}
          >
            <span className={value ? '' : 'text-gray-500'}>
              {value ? formatDisplayValue(value) : placeholder}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-4">
            <h3 className="font-medium text-sm mb-4">{placeholder}</h3>
            
            <div className="flex items-center justify-center gap-4">
              {/* Selector de Horas */}
              <div className="flex flex-col items-center">
                <div className="text-xs text-gray-500 mb-2">Horas</div>
                <div 
                  className="h-40 w-16 overflow-y-auto border rounded-lg scrollbar-hide" 
                  style={{
                    scrollbarWidth: 'none', 
                    msOverflowStyle: 'none'
                  }}
                >
                  <div className="py-2">
                    {Array.from({ length: 24 }, (_, i) => (
                      <button
                        key={i}
                        className={`w-full py-2 text-center hover:bg-accent transition-colors ${
                          hours === i ? 'bg-blue-500 text-white' : ''
                        }`}
                        onClick={() => handleTimeChange(i, minutes)}
                      >
                        {i.toString().padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-2xl font-bold">:</div>

              {/* Selector de Minutos */}
              <div className="flex flex-col items-center">
                <div className="text-xs text-gray-500 mb-2">Minutos</div>
                <div 
                  className="h-40 w-16 overflow-y-auto border rounded-lg scrollbar-hide" 
                  style={{
                    scrollbarWidth: 'none', 
                    msOverflowStyle: 'none'
                  }}
                >
                  <div className="py-2">
                    {Array.from({ length: 60 }, (_, i) => (
                      <button
                        key={i}
                        className={`w-full py-2 text-center hover:bg-accent transition-colors ${
                          minutes === i ? 'bg-blue-500 text-white' : ''
                        }`}
                        onClick={() => handleTimeChange(hours, i)}
                      >
                        {i.toString().padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>


          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Para modo date, usar input nativo
  return (
    <div className="relative">
      <Button
        variant="outline"
        className="w-full justify-between h-12 font-normal cursor-pointer"
        disabled={disabled}
        asChild
      >
        <label>
          <span className={value ? '' : 'text-gray-500'}>
            {value ? formatDisplayValue(value) : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
          <input
            type="date"
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            style={{ zIndex: 1 }}
          />
        </label>
      </Button>
    </div>
  );
}