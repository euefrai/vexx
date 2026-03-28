"use client";

import { useState, useEffect } from "react";
import { MapPin, Navigation, X, Loader, Search } from "lucide-react";

export default function LocationSearch({ onLocationSelect, currentPosition }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingCurrent, setIsLoadingCurrent] = useState(false);
  const [recentLocations] = useState([
    { id: "home", name: "Casa", address: "Seu endereço residencial", icon: "🏠" },
    { id: "work", name: "Trabalho", address: "Seu endereço comercial", icon: "💼" },
    { id: "gym", name: "Academia", address: "Seu local de treino", icon: "💪" },
  ]);

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 3) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async (query) => {
    setIsSearching(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Timeout 10s

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=8&countrycodes=br`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[LocationSearch] HTTP ${response.status}`);
        setSearchResults([]);
        return;
      }

      const data = await response.json();

      const results = data
        .filter((item) => item.lat && item.lon)
        .map((item) => ({
          id: `${item.lat}-${item.lon}`,
          name: item.name || item.display_name?.split(",")[0] || "Local",
          address: item.display_name || "",
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }));

      setSearchResults(results);
    } catch (error) {
      if (error.name === "AbortError") {
        console.warn("[LocationSearch] Nominatim timeout após 10s");
      } else {
        console.error("[LocationSearch] Erro ao buscar:", error);
      }
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCurrentLocation = () => {
    setIsLoadingCurrent(true);
    if ("geolocation" in navigator) {
      console.debug("[LocationSearch] Obtendo localização atual...");
      
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          console.debug(`[LocationSearch] ✅ Localização atual: lat=${latitude}, lng=${longitude}, accuracy=${accuracy}m`);
          
          onLocationSelect({
            name: "Minha Localização Atual",
            address: `${accuracy.toFixed(0)}m de precisão`,
            lat: latitude,
            lng: longitude,
          });
          setSearchQuery("");
          setSearchResults([]);
          setIsLoadingCurrent(false);
        },
        (error) => {
          console.error("[LocationSearch] ❌ Erro ao obter localização:", error.message);
          setIsLoadingCurrent(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Aumentado para Render
          maximumAge: 0,
        }
      );
    }
  };

  const handleSelectLocation = (location) => {
    onLocationSelect(location);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className="w-full space-y-3">
      {/* INPUT DE BUSCA */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 text-slate-400">
          {isSearching ? (
            <Loader size={18} className="animate-spin text-emerald-400" />
          ) : (
            <Search size={18} />
          )}
        </div>
        <input
          type="text"
          placeholder="Buscar local de destino..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-400 outline-none transition-all focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:bg-slate-800"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* BOTÃO DE LOCALIZAÇÃO ATUAL */}
      <button
        onClick={handleCurrentLocation}
        disabled={isLoadingCurrent}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300 text-sm"
      >
        {isLoadingCurrent ? (
          <>
            <Loader size={16} className="animate-spin" />
            Localizando...
          </>
        ) : (
          <>
            <Navigation size={16} />
            Usar Minha Localização
          </>
        )}
      </button>

      {/* RESULTADOS DE BUSCA */}
      {searchQuery && searchResults.length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
          {searchResults.map((result) => (
            <button
              key={result.id}
              onClick={() => handleSelectLocation(result)}
              className="w-full text-left px-4 py-3 hover:bg-slate-700/40 transition-colors border-b border-slate-700/30 last:border-b-0 flex items-start gap-3"
            >
              <MapPin size={16} className="text-emerald-400 flex-shrink-0 mt-1" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{result.name}</p>
                <p className="text-xs text-slate-400 line-clamp-1">{result.address}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* LOCAIS RECENTES (quando não há busca) */}
      {!searchQuery && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-1">Locais Conhecidos</p>
          <div className="grid grid-cols-3 gap-2">
            {recentLocations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => handleSelectLocation(loc)}
                className="flex flex-col items-center gap-2 p-3 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 rounded-xl transition-all duration-300 group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{loc.icon}</span>
                <p className="text-xs font-medium text-white text-center line-clamp-1">{loc.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MENSAGEM VAZIA */}
      {searchQuery && searchResults.length === 0 && !isSearching && (
        <div className="text-center py-8">
          <MapPin size={24} className="mx-auto mb-2 text-slate-400" />
          <p className="text-sm text-slate-400">Nenhum local encontrado</p>
          <p className="text-xs text-slate-500 mt-1">Tente outro local ou endereço</p>
        </div>
      )}
    </div>
  );
}
