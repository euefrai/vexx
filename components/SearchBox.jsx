"use client";

import { useState } from "react";

export default function SearchBox({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  async function handleSearch(e) {
    const value = e.target.value;
    setQuery(value);

    if (value.length < 3) {
      setResults([]);
      return;
    }

    try {
      const res = await fetch(
        `https://api.openrouteservice.org/geocode/autocomplete?text=${value}`,
        {
          headers: {
            Authorization: process.env.NEXT_PUBLIC_ORS_KEY,
          },
        }
      );

      const data = await res.json();

      setResults(data.features || []);
    } catch (err) {
      console.error("Erro ao buscar lugares:", err);
    }
  }

  function handleSelect(place) {
    const [lng, lat] = place.geometry.coordinates;

    onSelect({
      lat,
      lng,
      label: place.properties.label,
    });

    setQuery(place.properties.label);
    setResults([]);
  }

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
      
      {/* INPUT */}
      <input
        type="text"
        value={query}
        onChange={handleSearch}
        placeholder="Para onde vamos? 🚀"
        className="w-full px-4 py-3 rounded-xl bg-slate-900/90 text-white border border-slate-700 focus:outline-none"
      />

      {/* RESULTADOS */}
      {results.length > 0 && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl mt-2 max-h-60 overflow-y-auto">
          {results.map((place, index) => (
            <div
              key={index}
              onClick={() => handleSelect(place)}
              className="p-3 text-sm hover:bg-slate-800 cursor-pointer border-b border-slate-800"
            >
              {place.properties.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}