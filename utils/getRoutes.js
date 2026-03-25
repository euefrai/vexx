export async function getRoute(start, end) {
  try {
    const res = await fetch(
        "https://api.openrouteservice.org/v2/directions/foot-walking",
        {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            "Authorization": process.env.NEXT_PUBLIC_ORS_KEY, // Usa a variável aqui
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
      const errorData = await res.json();
      console.error("Erro na API de Rota:", errorData);
      return null;
    }

    const data = await res.json();

    // Verifica se a geometria existe antes de mapear
    if (data.features && data.features.length > 0) {
      return data.features[0].geometry.coordinates.map(coord => [
        coord[1], // Latitude (Leaflet)
        coord[0], // Longitude (Leaflet)
      ]);
    }

    return null;
  } catch (error) {
    console.error("Erro ao buscar rota:", error);
    return null;
  }
}