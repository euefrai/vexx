import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "API KEY não configurada no servidor." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é um treinador profissional e instrutor de elite do VEXX SQUAD. Crie treinos práticos e diretos."
        },
        {
          role: "user",
          content: `Crie um treino baseado nisso:
${prompt}

Responda exatamente assim:

Nome do Treino
Exercício: séries

Sem explicações extras ou introduções.`
        }
      ]
    });

    const texto = response.choices[0].message.content || "Erro ao gerar treino";

    return NextResponse.json({ treino: texto });

  } catch (error) {
    console.error("🔥 ERRO GERAL NO GERADOR DE TREINOS:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno no servidor" },
      { status: 500 }
    );
  }
}