export async function getRoute(start, end) {
  try {
    const key = (process.env.NEXT_PUBLIC_ORS_KEY || "").trim();
    
    if (!key) {
      console.warn("[ORS] API key ausente ou vazia, usando rota simples");
      return [
        [start.lat, start.lng],
        [end.lat, end.lng],
      ];
    }

    console.debug(`[ORS] Key presente (${key.length} chars). Chamando API...`);

    const res = await fetch(
      "https://api.openrouteservice.org/v2/directions/foot-walking",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": key,
        },
        body: JSON.stringify({
          coordinates: [
            [start.lng, start.lat],
            [end.lng, end.lat],
          ],
        }),
      }
    );

    if (!res.ok) {
      const texto = await res.text().catch(() => "sem corpo");
      console.error(`[ORS] Erro HTTP ${res.status}: ${res.statusText}`, texto.substring(0, 200));
      if (res.status === 401 || res.status === 403) {
        console.error("[ORS] ⚠️ Key inválida, expirada ou sem permissão (401/403)");
      }
      // Fallback: rota simples
      return [
        [start.lat, start.lng],
        [end.lat, end.lng],
      ];
    }

    const data = await res.json();
    console.debug("[ORS] Resposta recebida, processando geometria...");

    // Verifica se a geometria existe antes de mapear
    if (data.features && data.features.length > 0) {
      const coordinates = data.features[0].geometry.coordinates.map(coord => [
        coord[1], // Latitude (Leaflet)
        coord[0], // Longitude (Leaflet)
      ]);
      console.debug(`[ORS] ✅ Rota calculada com ${coordinates.length} pontos`);
      return coordinates;
    }

    // Fallback: rota simples
    console.warn("[ORS] Nenhuma feature na resposta, usando rota simples");
    return [
      [start.lat, start.lng],
      [end.lat, end.lng],
    ];
  } catch (error) {
    console.error("[ORS] Exceção:", error.message);
    // Fallback: rota simples entre os dois pontos
    return [
      [start.lat, start.lng],
      [end.lat, end.lng],
    ];
  }
}