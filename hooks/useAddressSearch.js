import { useState, useCallback } from "react";

export function useAddressSearch() {
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Usando OpenStreetMap Nominatim para busca de endereços (gratuito, sem API key)
  const searchAddress = useCallback(async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchQuery(query);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=10&countrycodes=br`
      );
      const data = await response.json();

      const results = data
        .filter((item) => item.lat && item.lon)
        .map((item) => ({
          id: `${item.lat}-${item.lon}`,
          name: item.name || item.display_name?.split(",")[0] || "Local",
          address: item.display_name || "",
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          type: item.type || "location",
        }));

      setSearchResults(results);
    } catch (error) {
      console.error("Erro ao buscar endereço:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  return {
    searchResults,
    isSearching,
    searchQuery,
    searchAddress,
    clearSearch,
  };
}
