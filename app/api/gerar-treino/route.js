import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "API KEY não configurada" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini", // 🔥 MAIS ESTÁVEL
        input: `
Você é um treinador profissional.

Crie um treino baseado nisso:
${prompt}

Responda exatamente assim:

Nome do Treino
Exercício: séries

Sem explicações extras.
        `,
      }),
    });

    if (!response.ok) {
      const erro = await response.text();
      console.error("❌ ERRO OPENAI:", erro);

      return NextResponse.json(
        { error: "Erro na OpenAI", details: erro },
        { status: 500 }
      );
    }

    const data = await response.json();

    const texto =
      data.output?.[0]?.content?.[0]?.text || "Erro ao gerar treino";

    return NextResponse.json({ treino: texto });

  } catch (error) {
    console.error("🔥 ERRO GERAL:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}