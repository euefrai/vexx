import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    // 🔥 DEBUG (importantíssimo)
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ API KEY não encontrada");
      return NextResponse.json(
        { error: "API KEY não configurada" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // 🔥 se der erro troca pra gpt-4o
        messages: [
          {
            role: "system",
            content: `Você é um treinador de elite.

Responda EXATAMENTE assim:

Nome do Treino
Exercício: séries

Exemplo:
Supino: 4x10
Agachamento: 3x12

Sem explicações.`
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    // 🔥 TRATAMENTO REAL DE ERRO
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro HTTP:", errorText);

      return NextResponse.json(
        { error: "Erro na OpenAI", details: errorText },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      console.error("❌ Resposta inválida:", data);
      return NextResponse.json(
        { error: "Resposta inválida da IA" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      treino: data.choices[0].message.content,
    });

  } catch (error) {
    console.error("🔥 ERRO GERAL:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}