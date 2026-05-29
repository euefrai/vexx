export async function getRoute(start, end, retryCount = 0) {
  try {
    const rawKey = (process.env.NEXT_PUBLIC_ORS_KEY || "").trim();
    // Validação inteligente: se for chave temporária/placeholder ou vazia, ignora e usa OSRM público
    const isKeyValid = rawKey && 
                       !rawKey.toLowerCase().includes("placeholder") && 
                       !rawKey.toLowerCase().includes("sua-chave") && 
                       rawKey.length > 25;

    // 1. SE NÃO POSSUIR UMA CHAVE ORS VÁLIDA, ACIONA PILHA DE ROTEADORES PÚBLICOS DE ALTO RENDIMENTO
    if (!isKeyValid) {
      console.debug("[getRoute] Chave ORS ausente ou inválida. Acionando pilha OpenStreetMap/OSRM...");

      // CAMADA A: OpenStreetMap Alemanha - Rota Pedestre (foot) - Altamente estável, CORS ativo, mapeia calçadas e ciclovias
      try {
        const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            console.debug(`[OSM Germany Foot] ✅ Rota calculada pelas ruas com ${coords.length} pontos`);
            return coords;
          }
        }
      } catch (err) {
        console.warn("[OSM Germany Foot] Falhou, tentando OSM Germany Driving...", err.message);
      }

      // CAMADA B: OpenStreetMap Alemanha - Rota Veículos (routed-car/driving) - Fallback rápido e excelente para vias urbanas
      try {
        const url = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            console.debug(`[OSM Germany Driving] ✅ Rota calculada pelas ruas com ${coords.length} pontos`);
            return coords;
          }
        }
      } catch (err) {
        console.warn("[OSM Germany Driving] Falhou, tentando OSRM Demo...", err.message);
      }

      // CAMADA C: OSRM Public Demo Server - Rota Veículos - Contingência global pública
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            console.debug(`[OSRM Public Demo] ✅ Rota calculada pelas ruas com ${coords.length} pontos`);
            return coords;
          }
        }
      } catch (err) {
        console.warn("[OSRM Public Demo] Falhou:", err.message);
      }

      // Fallback absoluto: Reta entre os pontos caso toda a rede de roteamento global esteja inacessível
      console.warn("[getRoute] Todos os roteadores públicos falharam. Usando linha reta.");
      return [
        [start.lat, start.lng],
        [end.lat, end.lng],
      ];
    }

    // 2. CASO A CHAVE DO ORS EXISTA E SEJA VÁLIDA
    console.debug(`[ORS] Chave ativa detectada (${rawKey.length} chars). Tentando OpenRouteService...`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(
      "https://api.openrouteservice.org/v2/directions/foot-walking",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": rawKey,
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
      const texto = await res.text().catch(() => "sem resposta");
      console.error(`[ORS] Erro HTTP ${res.status}: ${res.statusText}`, texto.substring(0, 150));
      
      // Contingência imediata: se o ORS der erro de quota/limite, chaveia imediatamente para a pilha pública
      console.warn("[getRoute] ORS falhou. Ativando OpenStreetMap Alemanha de contingência...");
      try {
        const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
        const osrmRes = await fetch(url);
        if (osrmRes.ok) {
          const osrmData = await osrmRes.json();
          if (osrmData.routes && osrmData.routes.length > 0) {
            return osrmData.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          }
        }
      } catch (osrmErr) {
        console.error("[ORS Fallback OSM] Falhou:", osrmErr.message);
      }

      return [
        [start.lat, start.lng],
        [end.lat, end.lng],
      ];
    }

    const data = await res.json();
    if (data.features && data.features.length > 0) {
      const coordinates = data.features[0].geometry.coordinates.map(coord => [
        coord[1],
        coord[0],
      ]);
      console.debug(`[ORS] ✅ Rota calculada com ${coordinates.length} pontos`);
      return coordinates;
    }

    return [
      [start.lat, start.lng],
      [end.lat, end.lng],
    ];
  } catch (error) {
    console.error("[getRoute] Exceção crítica. Tentando OpenStreetMap Alemanha de contingência...", error.message);
    try {
      const url = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
      const osrmRes = await fetch(url);
      if (osrmRes.ok) {
        const osrmData = await osrmRes.json();
        if (osrmData.routes && osrmData.routes.length > 0) {
          return osrmData.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        }
      }
    } catch (osrmErr) {
      console.error("[getRoute Final Fallback OSM] Falhou:", osrmErr.message);
    }

    return [
      [start.lat, start.lng],
      [end.lat, end.lng],
    ];
  }
}