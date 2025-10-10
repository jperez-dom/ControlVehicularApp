import React, { useState, useRef, useCallback } from 'react';

interface FuelGaugeProps {
  value: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  label?: string;
}

// Opciones discretas de combustible
const FUEL_OPTIONS = [
  { value: 0, label: 'VACÍO' },
  { value: 25, label: '1/4' },
  { value: 50, label: '1/2' },
  { value: 75, label: '3/4' },
  { value: 100, label: 'LLENO' }
];

export function FuelGauge({
  value = 50,
  onChange,
  disabled = false,
  label = "Nivel de Combustible"
}: FuelGaugeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const gaugeRef = useRef<SVGSVGElement>(null);

  // CONFIGURACIÓN OPTIMIZADA PARA MÓVIL - ARCO HACIA ARRIBA MÁS GRANDE
  const svgWidth = 450;
  const svgHeight = 320;
  const centerX = 225;
  const centerY = 250;
  const radius = 200;
  
  // Ángulos del medidor hacia ARRIBA (de 210° a 330°)
  const startAngle = 210; // 210° (abajo izquierda)
  const endAngle = 330;   // 330° (abajo derecha)
  const startAngleRad = (startAngle * Math.PI) / 180;
  const endAngleRad = (endAngle * Math.PI) / 180;

  const calculateAngleFromPosition = useCallback((clientX: number, clientY: number) => {
    if (!gaugeRef.current) return value;

    const rect = gaugeRef.current.getBoundingClientRect();
    const scaleX = svgWidth / rect.width;
    const scaleY = svgHeight / rect.height;
    
    // Convertir coordenadas del cliente a coordenadas SVG
    const svgX = (clientX - rect.left) * scaleX;
    const svgY = (clientY - rect.top) * scaleY;
    
    // Calcular ángulo desde el centro
    const dx = svgX - centerX;
    const dy = svgY - centerY;
    let angle = Math.atan2(dy, dx);
    
    // Convertir de radianes a grados
    let degrees = (angle * 180) / Math.PI;
    
    // Normalizar el ángulo para el rango del medidor (210° a 330°)
    if (degrees < 0) degrees += 360;
    
    // Mapear ángulo a porcentaje (0-100)
    // 210° = 0%, 270° = 50%, 330° = 100%
    let percentage;
    if (degrees >= 210 && degrees <= 330) {
      percentage = ((degrees - 210) / 120) * 100;
    } else if (degrees > 330 || degrees < 210) {
      // Manejar casos fuera del rango
      if (degrees > 330) {
        percentage = 100;
      } else if (degrees < 210 && degrees > 180) {
        percentage = 0;
      } else {
        // Para otros casos, usar la distancia más cercana
        const dist1 = Math.abs(degrees - 210);
        const dist2 = Math.abs(degrees - 330);
        percentage = dist1 < dist2 ? 0 : 100;
      }
    } else {
      percentage = ((degrees - 210) / 120) * 100;
    }
    
    // Limitar entre 0 y 100
    percentage = Math.max(0, Math.min(100, percentage));
    
    return Math.round(percentage);
  }, [value]);

  const handleInteraction = useCallback((clientX: number, clientY: number) => {
    if (disabled || !onChange) return;
    
    const continuousValue = calculateAngleFromPosition(clientX, clientY);
    
    // Encontrar la opción más cercana
    const closestOption = FUEL_OPTIONS.reduce((closest, option) => {
      const currentDistance = Math.abs(continuousValue - closest.value);
      const optionDistance = Math.abs(continuousValue - option.value);
      return optionDistance < currentDistance ? option : closest;
    });
    
    onChange(closestOption.value);
  }, [disabled, onChange, calculateAngleFromPosition]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    handleInteraction(e.clientX, e.clientY);
  }, [disabled, handleInteraction]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    const touch = e.touches[0];
    handleInteraction(touch.clientX, touch.clientY);
  }, [disabled, handleInteraction]);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleInteraction(e.clientX, e.clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        e.preventDefault();
        const touch = e.touches[0];
        handleInteraction(touch.clientX, touch.clientY);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, handleInteraction]);

  // Calcular posición de la aguja para arco hacia arriba
  const needleAngleRad = startAngleRad + (value / 100) * (endAngleRad - startAngleRad);
  const needleLength = radius - 40;
  const needleX = centerX + needleLength * Math.cos(needleAngleRad);
  const needleY = centerY + needleLength * Math.sin(needleAngleRad);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Label */}
      <div className="text-center">


      </div>

      {/* Medidor SVG */}
      <div className="w-full flex justify-center py-[-46px] outline-none border-none ring-0 focus:outline-none focus:ring-0 focus:border-none active:outline-none active:ring-0 focus-within:outline-none focus-within:ring-0 shadow-none bg-transparent mx-[74px] px-[3px] py-[-28px] my-[-11px] mx-[165px] my-[-45px]">
        <svg
          ref={gaugeRef}
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="touch-none select-none w-full max-w-lg"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Marcas de medición para las 4 opciones de combustible */}
          {FUEL_OPTIONS.map((option, index) => {
            const angleRange = endAngleRad - startAngleRad;
            const angle = startAngleRad + (option.value / 100) * angleRange;
            const markLength = 35;
            const innerRadius = radius - markLength;
            
            const x1 = centerX + innerRadius * Math.cos(angle);
            const y1 = centerY + innerRadius * Math.sin(angle);
            const x2 = centerX + (radius - 5) * Math.cos(angle);
            const y2 = centerY + (radius - 5) * Math.sin(angle);
            
            return (
              <line
                key={option.value}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#000000"
                strokeWidth="4"
                strokeLinecap="round"
              />
            );
          })}

          {/* Etiquetas para las 4 opciones de combustible */}
          {FUEL_OPTIONS.map((option) => {
            const angleRange = endAngleRad - startAngleRad;
            const angle = startAngleRad + (option.value / 100) * angleRange;
            const textRadius = radius - 65;
            
            const textX = centerX + textRadius * Math.cos(angle);
            const textY = centerY + textRadius * Math.sin(angle);
            
            return (
              <text
                key={option.value}
                x={textX}
                y={textY + 5}
                className="text-sm font-bold fill-black"
                textAnchor="middle"
              >
                {option.label}
              </text>
            );
          })}

          {/* Aguja indicadora */}
          <line
            x1={centerX}
            y1={centerY}
            x2={needleX}
            y2={needleY}
            stroke="#000000"
            strokeWidth="6"
            strokeLinecap="round"
          />
          
          {/* Punta de la aguja - triángulo */}
          <polygon
            points={`${needleX},${needleY-8} ${needleX-6},${needleY+6} ${needleX+6},${needleY+6}`}
            fill="#000000"
          />

          {/* Centro del medidor */}
          <circle
            cx={centerX}
            cy={centerY}
            r="15"
            fill="#000000"
          />

          {/* Área interactiva invisible - semicírculo superior */}
          <path
            d={`M ${centerX - radius - 20} ${centerY} A ${radius + 20} ${radius + 20} 0 0 1 ${centerX + radius + 20} ${centerY} L ${centerX + radius + 20} ${centerY + 50} L ${centerX - radius - 20} ${centerY + 50} Z`}
            fill="transparent"
            className={disabled ? "cursor-not-allowed" : "cursor-pointer"}
          />
        </svg>
      </div>


    </div>
  );
}