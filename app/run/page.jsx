"use client";
// Força o Next.js a não tentar pré-renderizar essa página no servidor
export const dynamic = 'force-dynamic';

import React, { useMemo } from 'react';
import dynamicNext from 'next/dynamic';
import { useTracker } from '@/hooks/useTracker';
import RunTracker from '@/components/RunTracker';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

// Importação dinâmica do Mapa para evitar erro de "window is not defined"
const MapContainer = dynamicNext(
  () => import('@/components/Map').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-900 animate-pulse flex items-center justify-center text-slate-500">
        Carregando Mapa...
      </div>
    ),
  }
);

export default function RunPage() {
  const trackerProps = useTracker();

  const currentPosition = useMemo(() => {
    return trackerProps.positions.length > 0 
      ? trackerProps.positions[trackerProps.positions.length - 1] 
      : null;
  }, [trackerProps.positions]);

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="p-4 flex items-center border-b border-slate-900 z-20 bg-slate-950">
        <Link href="/" className="p-2 hover:bg-slate-900 rounded-full">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="ml-2 font-bold tracking-widest text-xs uppercase text-slate-400">Atividade em Tempo Real</h1>
      </header>

      {/* Conteúdo: Mapa de Fundo + Tracker por cima */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 z-0">
          <MapContainer 
            positions={trackerProps.positions} 
            currentPosition={currentPosition} 
          />
        </div>
        
        <div className="absolute bottom-8 inset-x-0 z-10 px-4">
          {/* Espalhando as props do hook para o componente que você criou */}
          <RunTracker {...trackerProps} />
        </div>
      </div>
    </main>
  );
}