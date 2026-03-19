import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key não configurada no servidor." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const { messages, modo } = await req.json();

    // 🔥 PROMPT DINÂMICO BASEADO NO MODO
    const systemPrompt =
      modo === "rotulo"
        ? `
Analise rótulos alimentícios.

Retorne APENAS um JSON válido com:
{
  "alimento": "nome do produto",
  "proteina": number,
  "carbo": number,
  "gordura": number,
  "calorias": number,
  "nota_pureza": number (0 a 100),
  "veredito": "texto curto explicando qualidade dos ingredientes"
}
`
        : `
Analise alimentos.

Retorne APENAS um JSON válido com:
{
  "alimento": "nome da comida",
  "proteina": number,
  "carbo": number,
  "gordura": number,
  "calorias": number
}
`;

    // 🔥 NOVA API (CORRETA)
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages,
      ],
      response_format: { type: "json_object" },
    });

    const content = response.output[0].content[0].text;

    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch (err) {
      return NextResponse.json(
        {
          error: "IA retornou JSON inválido",
          raw: content,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("ERRO API:", error);

    return NextResponse.json(
      {
        error: "Erro no servidor. Verifique API Key ou saldo da OpenAI.",
      },
      { status: 500 }
    );
  }
}