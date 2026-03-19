import { NextResponse } from "next/server";
import OpenAI from "openai";

// O servidor Next.js lerá as chaves do seu .env ou Vercel automaticamente
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { messages, modo } = await req.json();

    const systemPrompt = modo === 'rotulo' 
      ? "Atue como um especialista em segurança alimentar. Analise o RÓTULO. Extraia os macros e analise os INGREDIENTES. Responda APENAS um JSON: {\"alimento\": \"nome\", \"calorias\": 0, \"proteina\": 0, \"carbo\": 0, \"gordura\": 0, \"nota_pureza\": 0, \"veredito\": \"frase curta sobre a qualidade\"}"
      : "Atue como um nutricionista esportivo. Analise o alimento e estime os macros. Responda APENAS um JSON: {\"alimento\": \"nome\", \"calorias\": 0, \"proteina\": 0, \"carbo\": 0, \"gordura\": 0}";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      response_format: { type: "json_object" }
    });

    const content = JSON.parse(response.choices[0].message.content);
    return NextResponse.json(content);
  } catch (error) {
    console.error("Erro na API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}