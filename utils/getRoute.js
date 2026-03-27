export async function getRoute(start, end) {
  try {
    // Se não tiver API key, retorna uma rota simples (linha reta)
    if (!process.env.NEXT_PUBLIC_ORS_KEY) {
      console.warn("OpenRouteService API key não configurada, usando rota simples");
      return [
        [start.lat, start.lng],
        [end.lat, end.lng],
      ];
    }

    const res = await fetch(
      "https://api.openrouteservice.org/v2/directions/foot-walking",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": process.env.NEXT_PUBLIC_ORS_KEY,
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
      console.error("Erro na API de Rota:", res.statusText);
      // Fallback: rota simples
      return [
        [start.lat, start.lng],
        [end.lat, end.lng],
      ];
    }

    const data = await res.json();

    // Verifica se a geometria existe antes de mapear
    if (data.features && data.features.length > 0) {
      return data.features[0].geometry.coordinates.map(coord => [
        coord[1], // Latitude (Leaflet)
        coord[0], // Longitude (Leaflet)
      ]);
    }

    // Fallback: rota simples
    return [
      [start.lat, start.lng],
      [end.lat, end.lng],
    ];
  } catch (error) {
    console.error("Erro ao buscar rota:", error);
    // Fallback: rota simples entre os dois pontos
    return [
      [start.lat, start.lng],
      [end.lat, end.lng],
    ];
  }
}