import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const requestSchema = z.object({
  image: z.string().min(1, "Imagem é obrigatória"),
  tipo: z.enum(["comida", "rotulo"], { errorMap: () => ({ message: "Tipo deve ser 'comida' ou 'rotulo'" }) }),
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { image, tipo } = requestSchema.parse(body); // Validação com zod

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "API Key não configurada no servidor." }, { status: 500 });
    }

    // 🧭 Garante o cabeçalho do Base64 MIME adequado para o Vision da OpenAI
    let formattedImage = image;
    if (image && !image.startsWith("data:")) {
      formattedImage = `data:image/jpeg;base64,${image}`;
    }

    // 1. Definição do Prompt de Sistema baseado no modo
    const systemPrompt =
      tipo === "rotulo"
        ? `Você é um scanner de rótulos de elite do VEXX SQUAD. 
           Analise a imagem da tabela nutricional e extraia os valores correspondentes.
           Retorne APENAS um JSON no formato exato:
           {
             "alimento": "Nome do Produto",
             "proteina": number,
             "carbo": number,
             "gordura": number,
             "calorias": number,
             "nota_pureza": number,
             "veredito": "texto curto tático analisando os conservantes e pureza dos macros de forma militar"
           }`
        : `Você é um scanner de alimentos do VEXX SQUAD. 
           Identifique os alimentos na foto, estime o peso e calcule seus macronutrientes.
           Retorne APENAS um JSON no formato exato:
           {
             "alimento": "Descrição rápida do prato",
             "proteina": number,
             "carbo": number,
             "gordura": number,
             "calorias": number,
             "nota_pureza": number,
             "veredito": "texto curto tático avaliando a refeição como combustível operacional"
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
                url: formattedImage, // A imagem base64 formatada
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