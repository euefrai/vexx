import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error("CHAVE NÃO ENCONTRADA");
      return NextResponse.json({ error: "Configuração de chave ausente no servidor." }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });
    const { messages, modo } = await req.json();

    const systemPrompt = modo === 'rotulo' 
      ? "Atue como especialista em segurança alimentar. Analise o RÓTULO e dê um JSON: {\"alimento\": \"\", \"calorias\": 0, \"proteina\": 0, \"carbo\": 0, \"gordura\": 0, \"nota_pureza\": 0, \"veredito\": \"\"}"
      : "Atue como nutricionista. Estime os macros e dê um JSON: {\"alimento\": \"\", \"calorias\": 0, \"proteina\": 0, \"carbo\": 0, \"gordura\": 0}";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      response_format: { type: "json_object" }
    });

    return NextResponse.json(JSON.parse(response.choices[0].message.content));
  } catch (error) {
    console.error("ERRO OPENAI:", error.message);
    return NextResponse.json({ error: "Erro na IA: " + error.message }, { status: 500 });
  }
}