export async function getRoute(start, end, retryCount = 0) {
  try {
    // 🧭 ENCAMINHA A REQUISIÇÃO PARA NOSSO ENDPOINT DE SERVIDOR INTERNO
    // Isso evita bloqueios de CORS locais e de cabeçalho User-Agent no navegador
    const res = await fetch("/api/rota", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ start, end })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.route) {
        return data.route;
      }
    }
  } catch (err) {
    console.error("[getRoute Client Side] Falhou ao chamar API de roteamento:", err.message);
  }

  // Fallback absoluto em linha reta se a rede estiver completamente desconectada
  return [
    [start.lat, start.lng],
    [end.lat, end.lng],
  ];
}