import { NextResponse } from "next/server";
import OpenAI from "openai";

// Tenta pegar a chave de qualquer um dos dois nomes comuns
const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;

const openai = new OpenAI({ apiKey });

export async function POST(req) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: "Chave de API ausente no servidor." }, { status: 500 });
    }

    const { messages, modo } = await req.json();

    const systemPrompt = modo === 'rotulo' 
      ? "Atue como um especialista em segurança alimentar. Analise o RÓTULO. Extraia os macros e analise os INGREDIENTES. Responda APENAS um JSON: {\"alimento\": \"nome\", \"calorias\": 0, \"proteina\": 0, \"carbo\": 0, \"gordura\": 0, \"nota_pureza\": 0, \"veredito\": \"frase curta\"}"
      : "Atue como um nutricionista esportivo. Analise o alimento. Responda APENAS um JSON: {\"alimento\": \"nome\", \"calorias\": 0, \"proteina\": 0, \"carbo\": 0, \"gordura\": 0}";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      response_format: { type: "json_object" }
    });

    return NextResponse.json(JSON.parse(response.choices[0].message.content));
  } catch (error) {
    console.error("DETALHE DO ERRO:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}