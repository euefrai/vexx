import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { start, end } = body;

    if (!start || !end) {
      return NextResponse.json({ error: "Parâmetros start e end são obrigatórios" }, { status: 400 });
    }

    const headers = {
      "User-Agent": "VEXX-Squad-App/2.0 (Contact: tatico@vexx.com)",
      "Accept": "application/json"
    };

    // 1. TENTA OPENSTREETMAP ALEMANHA - PERFIL PEDESTRE (ROTA POR VIAS EXATAS)
    try {
      const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url, { headers, next: { revalidate: 120 } });
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          console.log(`[API ROTA SERVER] OSM Germany Foot calculado com ${coords.length} pontos`);
          return NextResponse.json({ route: coords });
        }
      }
    } catch (err) {
      console.warn("OSM Germany Foot falhou no servidor:", err.message);
    }

    // 2. TENTA OPENSTREETMAP ALEMANHA - PERFIL VEÍCULO (CONGRESSO URBANO DE CONTINGÊNCIA)
    try {
      const url = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url, { headers, next: { revalidate: 120 } });
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          console.log(`[API ROTA SERVER] OSM Germany Driving calculado com ${coords.length} pontos`);
          return NextResponse.json({ route: coords });
        }
      }
    } catch (err) {
      console.warn("OSM Germany Driving falhou no servidor:", err.message);
    }

    // 3. TENTA OSRM PUBLIC DEMO
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url, { headers, next: { revalidate: 120 } });
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          console.log(`[API ROTA SERVER] OSRM Public Demo calculado com ${coords.length} pontos`);
          return NextResponse.json({ route: coords });
        }
      }
    } catch (err) {
      console.warn("OSRM Public Demo falhou no servidor:", err.message);
    }

    // Fallback absoluto em linha reta se todos os servidores estiverem indisponíveis
    return NextResponse.json({ 
      route: [
        [start.lat, start.lng],
        [end.lat, end.lng]
      ] 
    });

  } catch (error) {
    console.error("ERRO CRÍTICO NO ROTEADOR DE SERVIDOR:", error);
    return NextResponse.json({ error: "Erro interno ao processar roteamento" }, { status: 500 });
  }
}
