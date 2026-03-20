import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { image, tipo } = await req.json(); // image: base64, tipo: 'comida' ou 'rotulo'

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "API Key não configurada no servidor." }, { status: 500 });
    }

    // 1. Definição do Prompt de Sistema baseado no modo
    const systemPrompt =
      tipo === "rotulo"
        ? `Você é um scanner de rótulos de elite do VEXX SQUAD. 
           Analise a imagem e extraia os valores nutricionais da porção principal.
           Retorne APENAS um JSON no formato:
           {
             "alimento": "Nome do Produto",
             "proteina": number,
             "carbo": number,
             "gordura": number,
             "calorias": number,
             "nota_pureza": number,
             "veredito": "texto curto e motivador"
           }`
        : `Você é um scanner de alimentos do VEXX SQUAD. 
           Identifique os alimentos na foto e estime o peso.
           Retorne APENAS um JSON no formato:
           {
             "alimento": "Descrição rápida do prato",
             "proteina": number,
             "carbo": number,
             "gordura": number,
             "calorias": number
           }`;

    // 2. Chamada para a API (Vision)
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Modelo que suporta visão e é barato
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "Analise esta imagem:" },
            {
              type: "image_url",
              image_url: {
                url: image, // A imagem base64 vinda do frontend
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" }, // Garante que a resposta seja um JSON válido
    });

    const content = response.choices[0].message.content;

    try {
      const parsed = JSON.parse(content);
      return NextResponse.json(parsed);
    } catch (err) {
      console.error("Erro ao parsear JSON da IA:", content);
      return NextResponse.json({ error: "IA falhou ao gerar dados estruturados" }, { status: 500 });
    }

  } catch (error) {
    console.error("ERRO NO SCANNER:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno no servidor" },
      { status: 500 }
    );
  }
}