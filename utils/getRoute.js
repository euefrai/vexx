export async function getRoute(start, end, retryCount = 0) {
  try {
    const key = (process.env.NEXT_PUBLIC_ORS_KEY || "").trim();
    
    // 1. SE A KEY DO OPENROUTESERVICE ESTIVER AUSENTE, TENTA O OSRM PÚBLICO GRATUITO (TRAÇA RUAS E CAMINHOS!)
    if (!key) {
      console.debug("[getRoute] Key ORS ausente. Usando OSRM público para traçar caminhos reais...");
      
      // Tenta rota pedestre (foot) no OSRM
      try {
        const url = `https://router.project-osrm.org/route/v1/foot/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            console.debug(`[OSRM Foot] ✅ Rota calculada pelas ruas com ${coords.length} pontos`);
            return coords;
          }
        }
      } catch (err) {
        console.warn("[OSRM Foot] Falhou, tentando OSRM driving...", err.message);
      }

      // Fallback para rota de carros (driving) no OSRM (altamente estável e mapeia todas as ruas do mundo)
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            console.debug(`[OSRM Driving] ✅ Rota calculada pelas ruas com ${coords.length} pontos`);
            return coords;
          }
        }
      } catch (err) {
        console.warn("[OSRM Driving] Falhou:", err.message);
      }

      // Fallback crítico caso o OSRM esteja fora do ar: Linha reta entre os pontos
      console.warn("[getRoute] OSRM offline, usando fallback de linha reta");
      return [
        [start.lat, start.lng],
        [end.lat, end.lng],
      ];
    }

    // 2. CASO A KEY DO ORS EXISTA, TENTA O PROCESSO PADRÃO DO ORS
    console.debug(`[ORS] Key presente (${key.length} chars). Tentativa ${retryCount + 1}/3...`);
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
      
      // Se deu erro de chave ou limite, tenta imediatamente o OSRM em vez de retornar linha reta
      console.warn("[getRoute] Falha no ORS. Acionando OSRM público como contingência...");
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
        const osrmRes = await fetch(url);
        if (osrmRes.ok) {
          const osrmData = await osrmRes.json();
          if (osrmData.routes && osrmData.routes.length > 0) {
            return osrmData.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          }
        }
      } catch (osrmErr) {
        console.error("[ORS Fallback OSRM] Falhou:", osrmErr.message);
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
    console.error("[getRoute] Exceção crítica, tentando OSRM final...", error.message);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
      const osrmRes = await fetch(url);
      if (osrmRes.ok) {
        const osrmData = await osrmRes.json();
        if (osrmData.routes && osrmData.routes.length > 0) {
          return osrmData.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        }
      }
    } catch (osrmErr) {
      console.error("[getRoute Final Fallback OSRM] Falhou:", osrmErr.message);
    }

    return [
      [start.lat, start.lng],
      [end.lat, end.lng],
    ];
  }
}