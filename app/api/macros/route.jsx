import { NextResponse } from "next/server";
import OpenAI from "openai";

// Inicializa a OpenAI (O Next.js vai ler do seu .env ou Vercel)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { messages, modo } = await req.json();

    // Prompt dinâmico: muda conforme o botão que você clica no site
    const instrucaoSistema = modo === 'rotulo' 
      ? "Atue como um especialista em segurança alimentar. Analise o RÓTULO. Extraia os macros e analise os INGREDIENTES (aditivos, açúcares). Responda APENAS um JSON: {\"alimento\": \"nome\", \"calorias\": 0, \"proteina\": 0, \"carbo\": 0, \"gordura\": 0, \"nota_pureza\": 0, \"veredito\": \"frase curta sobre a qualidade\"}"
      : "Atue como um nutricionista esportivo. Analise o alimento e estime os macros. Responda APENAS um JSON: {\"alimento\": \"nome\", \"calorias\": 0, \"proteina\": 0, \"carbo\": 0, \"gordura\": 0}";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: instrucaoSistema },
        ...messages
      ],
      response_format: { type: "json_object" }
    });

    const conteudo = JSON.parse(response.choices[0].message.content);
    return NextResponse.json(conteudo);

  } catch (error) {
    console.error("ERRO NA API:", error);
    return NextResponse.json({ error: "Falha na IA: " + error.message }, { status: 500 });
  }
}