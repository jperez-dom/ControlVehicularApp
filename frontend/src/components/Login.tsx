import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { toast } from "sonner";
import { motion } from 'motion/react';
import { authAPI } from "../api"; // Importa authAPI en lugar de api por defecto
import grupoOptimoLogo from 'figma:asset/220b05f22fbef50eaf6e2085eb40125dfd99d55b.png';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [otpCode, setOtpCode] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleInputChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtpCode = [...otpCode];
    newOtpCode[index] = value;
    setOtpCode(newOtpCode);

    // Clear error when user starts typing
    if (error) setError('');

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    
    if (pastedData.length > 0) {
      const newOtpCode = ['', '', '', ''];
      for (let i = 0; i < pastedData.length; i++) {
        newOtpCode[i] = pastedData[i];
      }
      setOtpCode(newOtpCode);
      
      // Focus the next empty input or the last input
      const nextIndex = Math.min(pastedData.length, 3);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const isFormValid = () => {
    return otpCode.every(digit => digit !== '');
  };

    const handleSubmit = async () => {
        if (!isFormValid()) return;

        const code = otpCode.join('');

        try {
            // CORREGIDO: Usar authAPI.login que guarda el user_id en localStorage
            const response = await authAPI.login(code);

            if (response.data.success) {
                toast.success("Acceso autorizado");
                onLogin(); // continúa al dashboard
            } else {
                setError("Código inválido");
            }
        } catch (error: any) {
            console.error("Error de login:", error);

            if (error.response?.status === 401) {
                setError("Código inválido o usuario no autorizado");
            } else if (error.response?.status === 404) {
                setError("El servidor no encontró la ruta de autenticación");
            } else {
                setError("Error al conectar con el servidor");
            }
        }
    };

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Safe Area Top */}
      <div className="h-12 bg-black"></div>
      
      {/* Header */}
      <div className="bg-black px-[16px] py-[5px]">
        <div className="flex items-center justify-center">
          <img 
            src={grupoOptimoLogo} 
            alt="GRUPO OPTIMO" 
            className="h-12 w-auto object-contain px-[54px] py-[0px]"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center pt-[93px] pr-[16px] pb-[16px] pl-[16px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className="w-full max-w-[320px] space-y-6"
        >
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 id="loginTitle" className="text-2xl text-black px-[0px] py-[11px] mt-[0px] mr-[0px] mb-[55px] ml-[0px] font-bold underline">Iniciar sesión</h1>
            <p className="text-gray-600">Ingresa tu código de acceso</p>
          </div>

          {/* OTP Input */}
          <div className="space-y-4">
            <div className="flex justify-center gap-3">
              {otpCode.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={`w-14 h-14 text-center text-xl border-2 rounded-lg bg-white transition-colors ${
                    error 
                      ? 'border-destructive focus:border-destructive' 
                      : 'border-gray-300 focus:border-black'
                  } focus:outline-none focus:ring-0`}
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-destructive text-sm text-center"
              >
                {error}
              </motion.p>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Button
              id="loginSubmit"
              className="w-full h-12"
              onClick={handleSubmit}
              disabled={!isFormValid()}
            >
              Continuar
            </Button>

            {/* Placeholder link */}
            <div className="text-center">
              <button 
                type="button"
                className="text-sm text-gray-400 cursor-not-allowed"
                disabled
              >
                Olvidé mi código
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}