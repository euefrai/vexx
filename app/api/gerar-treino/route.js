import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // Pegamos o corpo da requisição (o prompt enviado pelo usuário)
    const { prompt } = await req.json();

    // Chamada para a API da OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Você é um treinador de elite do VEXX SQUAD.
            Responda EXATAMENTE neste formato:
            Nome do Treino (na primeira linha)
            Exercício 1: Séries
            Exercício 2: Séries
            
            Não escreva textos extras, apenas o treino direto.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
      })
    });

    const data = await response.json();

    // Verificamos se a OpenAI respondeu com erro (ex: chave inválida)
    if (data.error) {
      console.error("Erro da OpenAI:", data.error);
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    // Retornamos apenas o texto do treino para o seu componente
    return NextResponse.json({
      treino: data.choices[0].message.content
    });

  } catch (error) {
    console.error("Erro no Servidor:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}