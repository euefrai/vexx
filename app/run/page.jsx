"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
const MapUber = dynamic(() => import("@/components/MapUber"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-[998]">
      <div className="text-center">
        <div className="w-10.5 h-10.5 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400 font-medium text-xs tracking-wider uppercase">Sincronizando Satélites...</p>
      </div>
    </div>
  )
});
import RunTracker from "@/components/RunTracker";
import LocationSearch from "@/components/LocationSearch";
import RunSummary from "@/components/RunSummary";
import { CelebracaoModal } from "@/components/CelebracaoModal";
import { useMapTracking } from "@/hooks/useMapTracking";
import Navbar from "@/components/Navbar";
import { X, MapPin, Zap, Sun, Moon, CloudRain, Cloud, Cpu, Sparkles, ShieldCheck, Volume2, VolumeX, EyeOff, Eye } from "lucide-react";
import RunStatus from "@/components/RunStatus";
import useAuth from "@/hooks/useAuth";
import { useGamificacao } from "@/hooks/useGamificacao";
import { supabase } from "@/lib/supabase";

export default function RunPage() {
  const { user } = useAuth();
  const { adicionarXP } = useGamificacao();

  // 📡 GPS TRACKING REAL HOOK
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

  // ⚙️ ESTADOS ADICIONAIS & SIMULADOR
  const [isSimulando, setIsSimulando] = useState(false);
  const [simDistance, setSimDistance] = useState(0);
  const [simTime, setSimTime] = useState(0);
  const [simPositions, setSimPositions] = useState([]);
  const [simCurrentPos, setSimCurrentPos] = useState(null);
  const [simSpeed, setSimSpeed] = useState(0);
  const [simHeading, setSimHeading] = useState(0);

  const [clima, setClima] = useState("sol");
  const [destination, setDestination] = useState(null);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [celebrando, setCelebrando] = useState(false);
  const [username, setUsername] = useState("Atleta VEXX");
  const [savingTreino, setSavingTreino] = useState(false);
  
  // HUD Collapse/Expand (Painel Ocultável)
  const [isHudCollapsed, setIsHudCollapsed] = useState(false);
  
  // Tactical Audio Coach (Voz tática de campo)
  const [isAudioCoach, setIsAudioCoach] = useState(true);

  // Gatilho para o replay do mapa
  const [triggerReplay, setTriggerReplay] = useState(false);

  // Intervalo do Simulador
  const simIntervalRef = useRef(null);

  const [userAvatar, setUserAvatar] = useState(null);

  // Obter Perfil do Usuário Autenticado (Codinome e Foto de Perfil)
  useEffect(() => {
    if (!user) return;
    async function fetchPerfil() {
      const { data } = await supabase
        .from("usuarios")
        .select("username, foto")
        .eq("id", user.id)
        .single();
      
      if (data?.username) {
        setUsername(data.username);
      }
      if (data?.foto) {
        setUserAvatar(data.foto);
      } else if (user?.user_metadata?.avatar_url) {
        setUserAvatar(user.user_metadata.avatar_url);
      }
    }
    fetchPerfil();
  }, [user]);

  // Sintetizador de voz inteligente (Tactical Audio Coach)
  const falar = useCallback((texto) => {
    if (typeof window !== "undefined" && window.speechSynthesis && isAudioCoach) {
      window.speechSynthesis.cancel(); // Cancelar falas anteriores
      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = "pt-BR";
      utterance.rate = 1.02; // Aceleração leve e tática
      utterance.pitch = 0.95; // Tom robusto e futurista
      window.speechSynthesis.speak(utterance);
    }
  }, [isAudioCoach]);

  // 🚀 LÓGICA DO SIMULADOR DE CORRIDA (MODO LABORATÓRIO)
  useEffect(() => {
    if (isSimulando && isActive) {
      let baseLat = currentPosition?.lat || -15.7942;
      let baseLng = currentPosition?.lng || -47.8822;

      if (simPositions.length === 0) {
        const startPos = { lat: baseLat, lng: baseLng, timestamp: Date.now(), speed: 0, heading: 0 };
        setSimPositions([startPos]);
        setSimCurrentPos(startPos);
      }

      simIntervalRef.current = setInterval(() => {
        setSimTime((prevTime) => {
          const nextTime = prevTime + 1;
          setSimDistance((prevDist) => prevDist + 0.0033);
          
          const currentSpeedVal = 11.5 + Math.sin(nextTime / 8) * 1.8;
          setSimSpeed(currentSpeedVal);

          const angle = nextTime * 0.08;
          const nextLat = baseLat + Math.sin(angle) * 0.00018 + (nextTime * 0.000008);
          const nextLng = baseLng + Math.cos(angle) * 0.00018 + (nextTime * 0.000008);
          const currentHeadingVal = (angle * 180) / Math.PI;
          setSimHeading(currentHeadingVal);

          const nextPos = {
            lat: nextLat,
            lng: nextLng,
            timestamp: Date.now(),
            speed: currentSpeedVal,
            heading: currentHeadingVal
          };

          setSimPositions((prev) => [...prev, nextPos]);
          setSimCurrentPos(nextPos);

          // Audio Coach Progress Alerts (ex: a cada 0.2 km simulado)
          const totalDist = simDistance + 0.0033;
          if (totalDist > 0 && Math.floor(totalDist * 5) > Math.floor(simDistance * 5)) {
            const distAnuncio = totalDist.toFixed(1).replace(".", " vírgula ");
            falar(`Atenção atleta: distância parcial, ${distAnuncio} quilômetros.`);
          }

          return nextTime;
        });
      }, 1000);
    } else {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
    }

    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [isSimulando, isActive, currentPosition, simPositions.length, simDistance, falar]);

  // Cálculos do Simulador
  const simPace = (() => {
    if (simDistance <= 0 || simTime <= 0) return "0:00";
    const paceDecimal = (simTime / 60) / simDistance;
    const min = Math.floor(paceDecimal);
    const sec = Math.round((paceDecimal - min) * 60);
    return min > 59 ? "--:--" : `${min}:${sec.toString().padStart(2, "0")}`;
  })();

  // Unificar Variáveis baseadas no Modo (Real ou Simulado)
  const activeDistance = isSimulando ? simDistance : distance;
  const activeTime = isSimulando ? simTime : time;
  const activePace = isSimulando ? simPace : pace;
  const activePositions = isSimulando ? simPositions : positions;
  const activeCurrentPos = isSimulando ? simCurrentPos : currentPosition;
  const activeHeading = isSimulando ? simHeading : heading;
  const activeSpeed = isSimulando ? simSpeed : currentSpeed;
  const activeAvgSpeed = isSimulando 
    ? (simDistance > 0 && simTime > 0 ? simDistance / (simTime / 3600) : 0)
    : avgSpeed;

  // Calcular Distância do ponto de partida ao ponto de destino (Fórmula Haversine real)
  const distanceStartToDest = useMemo(() => {
    if (!destination) return null;
    const startPt = activePositions.length > 0 ? activePositions[0] : activeCurrentPos;
    if (!startPt) return null;

    const R = 6371; // Raio da Terra em km
    const dLat = ((destination.lat - startPt.lat) * Math.PI) / 180;
    const dLng = ((destination.lng - startPt.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((startPt.lat * Math.PI) / 180) *
        Math.cos((destination.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, [activePositions, activeCurrentPos, destination]);

  // Calcular Distância restante da posição atual ao ponto de destino
  const distanceRemaining = useMemo(() => {
    if (!activeCurrentPos || !destination) return null;

    const R = 6371; // km
    const dLat = ((destination.lat - activeCurrentPos.lat) * Math.PI) / 180;
    const dLng = ((destination.lng - activeCurrentPos.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((activeCurrentPos.lat * Math.PI) / 180) *
        Math.cos((destination.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, [activeCurrentPos, destination]);

  // MEMOIZAR SELEÇÃO DE DESTINO (Fim absoluto dos flashes de render de mapa!)
  const handleDestinationSelect = useCallback((location) => {
    setDestination(location);
    setShowDestinationModal(false);
    falar("Ponto de destino configurado com sucesso.");
  }, [falar]);

  const clearDestination = useCallback(() => {
    setDestination(null);
    falar("Ponto de destino removido.");
  }, [falar]);

  // Iniciar Rastreamento
  const handleStartTracking = () => {
    falar("Iniciando rastreamento de treino tático. Sensores de satélite ativos.");
    startTracking();
  };

  // Pausar Rastreamento
  const handlePauseTracking = () => {
    falar("Atividade pausada temporariamente.");
    pauseTracking();
  };

  // Acionar Modal de Celebração
  const handleTriggerCelebracao = () => {
    if (!celebrando && activeDistance > 0) {
      setCelebrando(true);
      falar("Objetivo alcançado. Preparando telemetria para comemoração.");
      if (isSimulando) {
        // Pausar simulador
      } else {
        pauseTracking();
      }
      return;
    }
    resetLocalStates();
  };

  // Limpar estados locais de simulador e GPS
  const resetLocalStates = () => {
    resetTracking();
    setSimDistance(0);
    setSimTime(0);
    setSimPositions([]);
    setSimCurrentPos(null);
    setSimSpeed(0);
    setSimHeading(0);
    setIsSimulando(false);
    setShowSummary(false);
    clearDestination();
    setCelebrando(false);
    setTriggerReplay(false);
  };

  // 💾 GRAVAR TREINO DEFINITIVO NO SUPABASE + APLICAR XP REAL
  const handleSaveTreino = async () => {
    if (!user) return resetLocalStates();
    
    setSavingTreino(true);
    falar("Concluindo missão. Telemetria gravada com sucesso. Ótimo trabalho!");
    
    try {
      const tempoFormatado = `${Math.floor(activeTime / 60)}:${(activeTime % 60).toString().padStart(2, "0")}`;
      const calorias = Math.round(activeDistance * 68);
      const maxSpeedVal = activePositions.length > 0 ? Math.max(...activePositions.map(p => p.speed || 0)) : 0;

      // 1. Inserir na tabela treinos
      const { error } = await supabase
        .from("treinos")
        .insert({
          usuario_id: user.id,
          titulo: "Operação Corrida Tática",
          autor: username,
          grupo: "Cardio",
          descricao: `Distância: ${activeDistance.toFixed(2)} km\nTempo: ${tempoFormatado}\nRitmo: ${activePace} /km\nCalorias: ${calorias} kcal\nVelocidade Média: ${activeAvgSpeed.toFixed(1)} km/h\nVelocidade Máxima: ${maxSpeedVal.toFixed(1)} km/h`,
        });

      if (error) throw error;

      // 2. Adicionar XP real de Atleta (+500 XP)
      if (adicionarXP) {
        await adicionarXP(user.id, 500);
      }

      console.log("✅ Corrida gravada com sucesso!");
    } catch (err) {
      console.error("❌ Falha ao salvar telemetria da corrida:", err.message);
    } finally {
      setSavingTreino(false);
      resetLocalStates();
    }
  };

  // Alternar Modo Simulador
  const toggleSimulator = () => {
    if (isActive) {
      alert("Pausar a atividade atual antes de alternar os modos.");
      return;
    }
    const nextState = !isSimulando;
    if (nextState) {
      falar("Modo simulador de laboratório ativado.");
    } else {
      falar("Modo simulador desativado.");
    }
    resetLocalStates();
    setIsSimulando(nextState);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-zinc-950 font-sans select-none">
      <Navbar />

      {/* 🗺️ MAPA TRIDIMENSIONAL PREMIUM (OCUPA 100% DO VIEWPORT) */}
      <div className="absolute inset-0 w-full h-full z-0">
        <MapUber
          positions={activePositions}
          currentPosition={activeCurrentPos}
          heading={activeHeading}
          currentSpeed={activeSpeed}
          destination={destination}
          onDestinationSelect={handleDestinationSelect}
          showRouteInfo={true}
          clima={clima}
          triggerReplay={triggerReplay}
          userAvatar={userAvatar}
        />
      </div>

      {/* ☀️ SELETOR DE CLIMA HUD (Flutuando no canto superior esquerdo) */}
      <div className="absolute top-20 left-4 z-40 bg-zinc-950/85 backdrop-blur-md border border-white/5 p-2 rounded-2xl flex items-center gap-1.5 shadow-2xl">
        <button
          onClick={() => { setClima("sol"); falar("Efeitos climáticos: ensolarado."); }}
          className={`p-2 rounded-xl transition-all ${clima === "sol" ? "bg-amber-500 text-zinc-950" : "text-zinc-500 hover:text-white"}`}
          title="Modo Dia"
        >
          <Sun size={14} />
        </button>
        <button
          onClick={() => { setClima("noite"); falar("Efeitos climáticos: noturno."); }}
          className={`p-2 rounded-xl transition-all ${clima === "noite" ? "bg-indigo-500 text-white" : "text-zinc-500 hover:text-white"}`}
          title="Modo Noite"
        >
          <Moon size={14} />
        </button>
        <button
          onClick={() => { setClima("chuva"); falar("Efeitos climáticos: chuva torrencial ativa."); }}
          className={`p-2 rounded-xl transition-all ${clima === "chuva" ? "bg-cyan-500 text-zinc-950" : "text-zinc-500 hover:text-white"}`}
          title="Modo Chuva"
        >
          <CloudRain size={14} />
        </button>
        <button
          onClick={() => { setClima("nublado"); falar("Efeitos climáticos: nublado."); }}
          className={`p-2 rounded-xl transition-all ${clima === "nublado" ? "bg-zinc-500 text-zinc-950" : "text-zinc-500 hover:text-white"}`}
          title="Modo Nublado"
        >
          <Cloud size={14} />
        </button>

        {/* Tactical Audio Selector */}
        <div className="w-[1px] h-6 bg-white/10 mx-1" />
        <button
          onClick={() => setIsAudioCoach(!isAudioCoach)}
          className={`p-2 rounded-xl transition-all ${isAudioCoach ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/25" : "text-zinc-500 hover:text-white"}`}
          title={isAudioCoach ? "Mutar Audio Coach" : "Ativar Audio Coach"}
        >
          {isAudioCoach ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>
      </div>

      {/* 📊 FLOATING HUD SIDEBAR (PAINEL DO ATLETA FLUTUANTE EM DESKTOP) */}
      <AnimatePresence>
        {!isHudCollapsed && (
          <motion.div
            className="absolute top-20 bottom-24 right-4 z-40 w-full max-w-[390px] hidden lg:flex flex-col bg-zinc-950/75 backdrop-blur-xl border border-white/10 p-5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
          >
            {/* Cabeçalho da Central do Atleta */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-zinc-950">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h2 className="text-xs font-black text-white uppercase tracking-wider">HUD do Atleta</h2>
                  <p className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest">{username}</p>
                </div>
              </div>

              {/* Simulação Indicator */}
              {isSimulando && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[8px] font-black uppercase tracking-wider rounded-lg animate-pulse">
                  Simulação
                </span>
              )}
            </div>

            {/* HUD Dinâmica ou Resumo */}
            <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-1">
              {/* Caixa de Busca ou Destino */}
              {!showSummary && (
                <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Navegação GPS</span>
                    {destination && (
                      <button
                        onClick={clearDestination}
                        className="text-[9px] px-2 py-0.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all font-black uppercase"
                      >
                        Limpar
                      </button>
                    )}
                  </div>

                  {destination ? (
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 flex items-start gap-2.5">
                      <MapPin size={16} className="text-purple-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-purple-300 truncate leading-none">{destination.name}</p>
                        {destination.address && (
                          <p className="text-[9px] text-zinc-500 mt-1 line-clamp-1 leading-none">{destination.address}</p>
                        )}
                        <div className="flex gap-4 mt-2.5 pt-2 border-t border-purple-500/15 text-[10px]">
                          <div>
                            <span className="text-zinc-500 uppercase block text-[7px] font-black tracking-wider">Dist. Planejada</span>
                            <span className="text-purple-300 font-extrabold">{distanceStartToDest ? `${distanceStartToDest.toFixed(2)} km` : "Calculando..."}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 uppercase block text-[7px] font-black tracking-wider">Restante</span>
                            <span className="text-emerald-400 font-extrabold">{distanceRemaining ? `${distanceRemaining.toFixed(2)} km` : "Calculando..."}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDestinationModal(!showDestinationModal)}
                      className="w-full px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300 hover:text-white font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-2"
                    >
                      <MapPin size={14} />
                      Adicionar Destino
                    </button>
                  )}

                  {showDestinationModal && (
                    <div className="bg-zinc-950 border border-white/5 rounded-xl p-2.5">
                      <LocationSearch onLocationSelect={handleDestinationSelect} currentPosition={activeCurrentPos} />
                    </div>
                  )}
                </div>
              )}

              {/* Tracker Principal ou Resumo */}
              {!showSummary ? (
                <RunTracker
                  isActive={isActive}
                  distance={activeDistance}
                  time={activeTime}
                  pace={activePace}
                  positions={activePositions}
                  startTracking={isSimulando ? () => { falar("Modo simulação iniciado."); startTracking(); } : handleStartTracking}
                  pauseTracking={isSimulando ? () => { falar("Modo simulação pausado."); pauseTracking(); } : handlePauseTracking}
                  resetTracking={handleTriggerCelebracao}
                  currentSpeed={activeSpeed}
                  avgSpeed={activeAvgSpeed}
                  isGPSConnected={isGPSConnected}
                  isSimulando={isSimulando}
                  onToggleSimulado={toggleSimulator}
                />
              ) : (
                <RunSummary 
                  distance={activeDistance} 
                  time={activeTime} 
                  pace={activePace} 
                  positions={activePositions} 
                  onTriggerReplay={() => setTriggerReplay(true)}
                />
              )}

              {/* Botão de Resumo Pós-Treino */}
              {isActive && activeDistance > 0 && (
                <button
                  onClick={() => setShowSummary(!showSummary)}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 text-white font-bold rounded-2xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 mt-2"
                >
                  <Zap size={14} />
                  {showSummary ? "Voltar ao Rastreamento" : "Ver Resumo Analítico"}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📱 MOBILE BOTTOM DRAWER HUD (Para aparelhos celulares e touch com AnimatePresence) */}
      <AnimatePresence>
        {!isHudCollapsed && (
          <motion.div
            className="absolute bottom-20 left-4 right-4 z-40 lg:hidden flex flex-col bg-zinc-950/85 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-2xl max-h-[48vh] overflow-y-auto"
            initial={{ y: 250, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 250, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">HUD Móvel ({username})</span>
              </div>
              
              {isSimulando && (
                <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[8px] font-black rounded-lg">Simulação</span>
              )}
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[40vh] pr-1">
              {!showSummary ? (
                <RunTracker
                  isActive={isActive}
                  distance={activeDistance}
                  time={activeTime}
                  pace={activePace}
                  positions={activePositions}
                  startTracking={isSimulando ? () => { falar("Modo simulação iniciado."); startTracking(); } : handleStartTracking}
                  pauseTracking={isSimulando ? () => { falar("Modo simulação pausado."); pauseTracking(); } : handlePauseTracking}
                  resetTracking={handleTriggerCelebracao}
                  currentSpeed={activeSpeed}
                  avgSpeed={activeAvgSpeed}
                  isGPSConnected={isGPSConnected}
                  isSimulando={isSimulando}
                  onToggleSimulado={toggleSimulator}
                />
              ) : (
                <RunSummary 
                  distance={activeDistance} 
                  time={activeTime} 
                  pace={activePace} 
                  positions={activePositions} 
                  onTriggerReplay={() => setTriggerReplay(true)}
                />
              )}

              {isActive && activeDistance > 0 && (
                <button
                  onClick={() => setShowSummary(!showSummary)}
                  className="w-full py-2.5 bg-white/5 border border-white/5 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5"
                >
                  <Zap size={12} />
                  {showSummary ? "Voltar ao Rastreamento" : "Painel Analítico"}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 👁️ BOTÃO FLOATING PARA RECOLHER/EXPANDIR HUD (Foco 100% no Mapa Fullscreen) */}
      <button
        onClick={() => {
          const nextState = !isHudCollapsed;
          setIsHudCollapsed(nextState);
          falar(nextState ? "Painel de telemetria recolhido para visualização de mapa." : "Painel de telemetria ativo.");
        }}
        className="absolute bottom-[80px] lg:bottom-[150px] right-4 sm:right-6 z-[402] flex items-center justify-center w-11 h-11 bg-zinc-900/95 hover:bg-zinc-800 text-white rounded-full shadow-2xl border border-white/10 backdrop-blur-md transition-all active:scale-90 hover:scale-105"
        title={isHudCollapsed ? "Expandir HUD" : "Recolher HUD"}
      >
        <motion.div
          animate={{ rotate: isHudCollapsed ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center text-emerald-400"
        >
          {isHudCollapsed ? <Eye size={18} /> : <EyeOff size={18} />}
        </motion.div>
      </button>

      {/* FLOAT RECORDING INDICATOR */}
      <div className="absolute bottom-6 right-6 lg:right-auto lg:left-6 z-50 flex gap-2">
        {isActive && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-full shadow-2xl animate-pulse">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
            <span className="text-[9px] text-rose-400 font-extrabold uppercase tracking-widest">GRAVAÇÃO TÁTICA ATIVA</span>
          </div>
        )}
      </div>

      {/* BANNER STATUS FLUTUANTE */}
      <RunStatus isActive={isActive} distance={activeDistance} isPaused={!isActive && activeDistance > 0} />

      {/* CELEBRAÇÃO CINEMATOGRÁFICA */}
      <CelebracaoModal
        isOpen={celebrando}
        onClose={handleSaveTreino}
        dados={{
          distancia: Number(activeDistance.toFixed(2)),
          tempo: `${Math.floor(activeTime / 60)}:${(activeTime % 60).toString().padStart(2, "0")}`,
          calorias: Math.round(activeDistance * 68),
          velocidadeMedia: Number(activeAvgSpeed.toFixed(1)),
        }}
      />
    </div>
  );
}