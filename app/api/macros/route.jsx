import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req) {
  // 1. Log para saber se a requisição chegou
  console.log("REQUISIÇÃO RECEBIDA NA API /API/MACROS");

  // 2. Verifica se a chave existe antes de instanciar
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("ERRO: OPENAI_API_KEY NÃO DEFINIDA NO .ENV");
    return NextResponse.json({ error: "Chave de API ausente no servidor." }, { status: 500 });
  }

  const openai = new OpenAI({ apiKey });

  try {
    const { messages } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      response_format: { type: "json_object" }
    });

    const resContent = response.choices[0].message.content;
    return NextResponse.json(JSON.parse(resContent));
  } catch (error) {
    // 3. Isso vai imprimir o erro real no seu terminal do VS Code
    console.error("ERRO DETALHADO DA OPENAI:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno na comunicação com a IA" }, 
      { status: 500 }
    );
  }
}