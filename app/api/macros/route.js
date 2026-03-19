import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key não configurada." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const { messages, modo } = await req.json();

    // 🔥 PROMPT
    const systemPrompt =
      modo === "rotulo"
        ? `Analise rótulos alimentícios e retorne JSON com:
{
  "alimento": "nome",
  "proteina": number,
  "carbo": number,
  "gordura": number,
  "calorias": number,
  "nota_pureza": number,
  "veredito": "texto curto"
}`
        : `Analise alimentos e retorne JSON com:
{
  "alimento": "nome",
  "proteina": number,
  "carbo": number,
  "gordura": number,
  "calorias": number
}`;

    // 🔥 CONVERSÃO SEGURA DAS MENSAGENS
    const input = [
      {
        role: "system",
        content: systemPrompt,
      },
    ];

    for (const msg of messages) {
      if (Array.isArray(msg.content)) {
        const parts = [];

        for (const item of msg.content) {
          if (item.type === "text") {
            parts.push({
              type: "input_text",
              text: item.text,
            });
          }

          if (item.type === "input_image") {
            parts.push({
              type: "input_image",
              image_url: item.image_url,
            });
          }
        }

        input.push({
          role: msg.role,
          content: parts,
        });
      } else {
        input.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // 🔥 CHAMADA CORRETA
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input,
      response_format: { type: "json_object" },
    });

    const content = response.output[0].content[0].text;

    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch (err) {
      console.error("JSON inválido:", content);

      return NextResponse.json(
        { error: "Resposta inválida da IA", raw: content },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);

  } catch (error) {
    console.error("ERRO BACKEND:", error);

    return NextResponse.json(
      {
        error: error.message || "Erro interno no servidor",
      },
      { status: 500 }
    );
  }
}