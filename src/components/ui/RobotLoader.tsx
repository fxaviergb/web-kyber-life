import React from 'react';
import Image from 'next/image';

interface RobotLoaderProps {
  className?: string;
  size?: number;
  text?: string;
}

export function RobotLoader({
  className = '',
  size = 96,
  text = 'Cargando'
}: RobotLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center space-y-6 p-4 ${className}`}>
      <div className="relative flex justify-center items-center">
        {/* Glow de fondo animado */}
        <div 
          className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full animate-pulse" 
          style={{ width: size * 1.2, height: size * 1.2, animationDuration: '2s' }}
        />
        
        {/* Estilos para animación de levitación suave */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes float-robot {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0px); }
          }
          .animate-float-robot {
            animation: float-robot 3s ease-in-out infinite;
          }
        `}} />
        
        {/* Imagen del Robot */}
        <div className="animate-float-robot relative z-10 drop-shadow-2xl">
          <Image
            src="/images/logo-kyber-blue.png"
            alt="KyberLife"
            width={size}
            height={size}
            className="object-contain"
            priority
          />
        </div>
      </div>
      
      {/* Texto de carga */}
      {text && (
        <div className="flex flex-col items-center space-y-2">
          <p className="text-sm font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
            {text}
          </p>
          <span className="flex space-x-1.5">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </div>
      )}
    </div>
  );
}
