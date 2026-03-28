"use client";

import { useState } from "react";
import Map from "@/components/Map";
import RunTracker from "@/components/RunTracker";
import LocationSearch from "@/components/LocationSearch";
import RunSummary from "@/components/RunSummary";
import { CelebracaoModal } from "@/components/CelebracaoModal";
import { useTracker } from "@/hooks/useTracker";
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
  } = useTracker();

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
    <div className="flex flex-col h-screen w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <Navbar />

      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/10 via-transparent to-blue-950/10 pointer-events-none" />

      <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden relative z-10">
        {/* 🗺️ MAPA */}
        <div
          className="flex-1 order-2 lg:order-1 relative w-full lg:w-3/5 h-auto lg:h-full bg-slate-900 shadow-2xl overflow-hidden"
          style={{ minHeight: "clamp(200px, 50vh, 100%)" }}
        >
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-emerald-500/5 via-transparent to-blue-500/5" />
          <Map
            positions={positions}
            currentPosition={currentPosition}
            destination={destination}
            onDestinationSelect={handleDestinationSelect}
          />
        </div>

        {/* 📊 PAINEL DE CONTROLE */}
        <div className="order-1 lg:order-2 w-full lg:w-2/5 h-auto lg:h-full bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800/50 p-3 sm:p-4 lg:p-6 flex flex-col overflow-y-auto">
          {/* HEADER */}
          <div className="text-center mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-slate-800/30">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/50 animate-pulse">
                <span className="text-lg sm:text-2xl">🏃</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                RUNNER PRO
              </h1>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium tracking-widest uppercase">
              Rastreador de Corrida Profissional
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
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-300 text-sm flex items-center justify-center gap-2"
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
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-4 flex-1 flex items-center justify-center min-h-[300px]">
                <RunTracker
                  isActive={isActive}
                  distance={distance}
                  time={time}
                  pace={pace}
                  positions={positions}
                  startTracking={startTracking}
                  pauseTracking={pauseTracking}
                  resetTracking={handleReset}
                />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-4 flex-1 overflow-y-auto">
                <RunSummary distance={distance} time={time} pace={pace} positions={positions} />
              </div>
            )}

            {/* BOTÃO DE CONCLUSÃO/RESUMO */}
            {isActive && distance > 0 && (
              <button
                onClick={() => setShowSummary(!showSummary)}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold rounded-xl transition-all duration-300 text-sm flex items-center justify-center gap-2"
              >
                <Zap size={16} />
                {showSummary ? "Voltar ao Tracker" : "Ver Resumo Detalhado"}
              </button>
            )}
          </div>

          {/* RODAPÉ */}
          <div className="mt-4 pt-4 border-t border-slate-800/30 text-center hidden sm:block">
            <p className="text-xs text-slate-500 leading-relaxed">
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