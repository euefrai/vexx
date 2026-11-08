/**
 * lib/yoloVision.js — Utilitário de Visão Computacional YOLOv8 para o ecossistema VEXX
 * Conecta-se à API no Hugging Face Spaces: https://euefrai-api-visao-yolo.hf.space
 */

export const YOLO_SPACE_URL = process.env.VEXX_VISION_API_URL || "https://euefrai-api-visao-yolo.hf.space";

/**
 * Envia uma imagem (Data URL Base64, URL pública ou buffer) para o endpoint YOLOv8
 * e retorna as detecções, objetos e tags.
 *
 * @param {string} imagem Base64 data URL ou URL pública da imagem
 * @returns {Promise<{ status: string, total_objetos: number, tags_busca: string, deteccoes: Array }>}
 */
export async function analisarImagemYolo(imagem) {
  try {
    const baseUrl = YOLO_SPACE_URL.replace(/\/$/, "");
    
    // Preparar formato de arquivo Gradio
    let formattedUrl = imagem;
    if (imagem && !imagem.startsWith("data:") && !imagem.startsWith("http")) {
      formattedUrl = `data:image/png;base64,${imagem}`;
    }

    // Tentar upload via multipart se for base64 ou enviar diretamente via call
    const payload = {
      data: [
        {
          path: formattedUrl,
          url: formattedUrl,
          orig_name: "image.png",
          meta: { _type: "gradio.FileData" },
        },
      ],
    };

    // Tenta os endpoints padrão do Gradio 5
    const endpoints = [
      `${baseUrl}/gradio_api/call/predict`,
      `${baseUrl}/gradio_api/call/detectar_objetos`,
      `${baseUrl}/call/predict`,
      `${baseUrl}/call/detectar_objetos`,
    ];

    let lastError = null;

    for (const ep of endpoints) {
      try {
        const postResp = await fetch(ep, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!postResp.ok) continue;

        const postData = await postResp.json();

        // Se retornar diretamente os dados
        if (postData?.data && Array.isArray(postData.data)) {
          return postData.data[0];
        }

        // Se retornar event_id (SSE do Gradio)
        const eventId = postData?.event_id;
        if (eventId) {
          const sseResp = await fetch(`${ep}/${eventId}`, {
            headers: { Accept: "text/event-stream" },
          });

          if (sseResp.ok) {
            const sseText = await sseResp.text();
            let ultimoData = null;
            const linhas = sseText.split(/\r?\n/);
            for (const linha of linhas) {
              const t = linha.trim();
              if (t.startsWith("data:")) {
                const val = t.slice(5).trim();
                if (val && val !== "null") ultimoData = val;
              }
            }
            if (ultimoData) {
              const parsed = JSON.parse(ultimoData);
              return Array.isArray(parsed) ? parsed[0] : parsed;
            }
          }
        }
      } catch (err) {
        lastError = err;
      }
    }

    return {
      status: "erro",
      mensagem: lastError ? String(lastError) : "Falha ao consultar API YOLO",
      total_objetos: 0,
      tags_busca: "",
      deteccoes: [],
    };
  } catch (err) {
    console.error("[YOLO Vision] Erro:", err);
    return {
      status: "erro",
      mensagem: String(err),
      total_objetos: 0,
      tags_busca: "",
      deteccoes: [],
    };
  }
}
