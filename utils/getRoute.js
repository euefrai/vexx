export async function getRoute(start, end, retryCount = 0) {
  try {
    const key = (process.env.NEXT_PUBLIC_ORS_KEY || "").trim();
    
    if (!key) {
      console.warn("[ORS] API key ausente ou vazia, usando rota simples");
      return [
        [start.lat, start.lng],
        [end.lat, end.lng],
      ];
    }

    console.debug(`[ORS] Key presente (${key.length} chars). Tentativa ${retryCount + 1}/3...`);

    // Timeout aumentado para 15s (Render pode ser mais lento que localhost)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

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
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!res.ok) {
      const texto = await res.text().catch(() => "sem corpo");
      console.error(`[ORS] Erro HTTP ${res.status}: ${res.statusText}`, texto.substring(0, 200));
      
      if (res.status === 401 || res.status === 403) {
        console.error("[ORS] ⚠️ Key inválida, expirada ou sem permissão (401/403)");
      } else if (res.status === 503 && retryCount < 2) {
        // Serviço indisponível - tentar novamente
        console.warn(`[ORS] Serviço indisponível. Tentando novamente em 1s...`);
        await new Promise(r => setTimeout(r, 1000));
        return getRoute(start, end, retryCount + 1);
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
    if (error.name === "AbortError") {
      console.error(`[ORS] ⏱️ Timeout (15s). Render pode estar sobrecarregado.`);
      if (retryCount < 2) {
        console.warn(`[ORS] Tentando novamente (tentativa ${retryCount + 2}/3)...`);
        await new Promise(r => setTimeout(r, 2000));
        return getRoute(start, end, retryCount + 1);
      }
    } else {
      console.error("[ORS] ❌ Exceção na request:", error.message);
    }
    // Fallback: rota simples entre os dois pontos
    return [
      [start.lat, start.lng],
      [end.lat, end.lng],
    ];
  }
}