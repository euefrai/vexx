"use client";

import { useState } from "react";
import MapUber from "@/components/MapUber";
import RunTracker from "@/components/RunTracker";
import LocationSearch from "@/components/LocationSearch";
import RunSummary from "@/components/RunSummary";
import { CelebracaoModal } from "@/components/CelebracaoModal";
import { useMapTracking } from "@/hooks/useMapTracking";
import Navbar from "@/components/Navbar";
import { X, MapPin, Zap } from "lucide-react";
import RunStatus from "@/components/RunStatus";

export default function RunPage() {
  const {
    isActive,
    distance,
    time,
    pace,
    positions,
    startTracking,
    pauseTracking,
    resetTracking,
    currentPosition,
    heading,
    currentSpeed,
    avgSpeed,
    isGPSConnected,
  } = useMapTracking();

  const [destination, setDestination] = useState(null);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [celebrando, setCelebrando] = useState(false);

  const handleDestinationSelect = (location) => {
    setDestination(location);
    setShowDestinationModal(false);
  };

  const clearDestination = () => {
    setDestination(null);
  };

  const handleReset = () => {
    if (!celebrando && distance > 0) {
      setCelebrando(true);
      return;
    }
    resetTracking();
    setShowSummary(false);
    clearDestination();
    setCelebrando(false);
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden fade-in">
      <Navbar />

      {/* Glass Background Overlay */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden relative z-10">
        {/* 🗺️ MAPA */}
        <div
          className="flex-1 order-2 lg:order-1 relative w-full lg:w-3/5 h-auto lg:h-full bg-transparent overflow-hidden border-t lg:border-t-0 lg:border-r border-white/5"
          style={{ minHeight: "clamp(200px, 50vh, 100%)" }}
        >
          <MapUber
            positions={positions}
            currentPosition={currentPosition}
            heading={heading}
            currentSpeed={currentSpeed}
            destination={destination}
            onDestinationSelect={handleDestinationSelect}
            showRouteInfo={true}
          />
        </div>

        {/* 📊 PAINEL DE CONTROLE */}
        <div className="order-1 lg:order-2 w-full lg:w-2/5 h-auto lg:h-full glass-panel border-none rounded-none p-4 lg:p-8 flex flex-col overflow-y-auto">
          {/* HEADER */}
          <div className="text-center mb-6 pb-6 border-b border-white/10">
            <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">
              Modo Corrida
            </h1>
            <p className="text-xs text-zinc-400 font-medium tracking-wide uppercase">
              Rastreamento via satélite
            </p>
          </div>

          {/* CONTEÚDO DINÂMICO */}
          <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
            {/* BUSCA DE LOCALIZAÇÃO */}
            {!showSummary && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Destino</h2>
                  {destination && (
                    <button
                      onClick={clearDestination}
                      className="text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors flex items-center gap-1"
                    >
                      <X size={12} /> Limpar
                    </button>
                  )}
                </div>

                {destination ? (
                  <div className="bg-gradient-to-r from-emerald-900/20 to-emerald-900/10 border border-emerald-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <MapPin size={20} className="text-emerald-400 flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-emerald-300 truncate">{destination.name}</p>
                        {destination.address && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{destination.address}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDestinationModal(!showDestinationModal)}
                    className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all duration-300 text-sm flex items-center justify-center gap-2 backdrop-blur-sm"
                  >
                    <MapPin size={16} />
                    Adicionar Destino
                  </button>
                )}

                {/* MODAL DE BUSCA */}
                {showDestinationModal && (
                  <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                    <LocationSearch onLocationSelect={handleDestinationSelect} currentPosition={currentPosition} />
                  </div>
                )}
              </div>
            )}

            {/* TRACKER OU SUMMARY */}
            {!showSummary ? (
              <div className="glass-panel p-6 flex-1 flex items-center justify-center min-h-[300px]">
                <RunTracker
                  isActive={isActive}
                  distance={distance}
                  time={time}
                  pace={pace}
                  positions={positions}
                  startTracking={startTracking}
                  pauseTracking={pauseTracking}
                  resetTracking={handleReset}
                  currentSpeed={currentSpeed}
                  avgSpeed={avgSpeed}
                  isGPSConnected={isGPSConnected}
                />
              </div>
            ) : (
              <div className="glass-panel p-4 flex-1 overflow-y-auto">
                <RunSummary distance={distance} time={time} pace={pace} positions={positions} />
              </div>
            )}

            {/* BOTÃO DE CONCLUSÃO/RESUMO */}
            {isActive && distance > 0 && (
              <button
                onClick={() => setShowSummary(!showSummary)}
                className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-medium rounded-xl transition-all duration-300 text-sm flex items-center justify-center gap-2"
              >
                <Zap size={16} />
                {showSummary ? "Voltar ao Tracker" : "Ver Resumo Detalhado"}
              </button>
            )}
          </div>

          {/* RODAPÉ */}
          <div className="mt-4 pt-4 border-t border-slate-800/30 text-center hidden sm:block">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                isGPSConnected 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                📡 {isGPSConnected ? 'GPS Online' : 'GPS Desconectado'}
              </div>
              {currentSpeed > 0 && (
                <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  ⚡ {currentSpeed.toFixed(1)} km/h
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mt-3">
              💡{" "}
              {isActive
                ? "Sua corrida está sendo rastreada em tempo real"
                : destination
                ? "Destino definido - pressione INICIAR"
                : "Clique no mapa ou defina um destino"}
            </p>
          </div>
        </div>
      </div>

      {/* INDICADOR DE GRAVAÇÃO */}
      <div className="absolute bottom-4 right-4 flex gap-2 z-50">
        {isActive && (
          <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur border border-slate-700/50 px-3 py-2 rounded-full animate-pulse">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs text-red-400 font-semibold">GRAVANDO</span>
          </div>
        )}
      </div>

      {/* STATUS DA CORRIDA */}
      <RunStatus isActive={isActive} distance={distance} isPaused={!isActive && distance > 0} />

      {/* CELEBRAÇÃO */}
      <CelebracaoModal
        isOpen={celebrando}
        onClose={handleReset}
        dados={{
          distancia: Number(distance.toFixed(2)),
          tempo: time,
          calorias: Math.round((distance / 1000) * 70),
          velocidadeMedia: Number((distance > 0 && time ? (distance / 1000) / (time.split(":").reduce((acc, val, idx) => acc + (parseInt(val) * (idx === 0 ? 60 : 1)), 0) / 3600) : 0).toFixed(1)),
        }}
      />
    </div>
  );
}