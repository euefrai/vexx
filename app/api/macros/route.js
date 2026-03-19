import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: "Chave não configurada no painel Render." }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });
    const { messages, modo } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Retorne APENAS um objeto JSON com os macros." },
        ...messages
      ],
      response_format: { type: "json_object" }
    });

    return NextResponse.json(JSON.parse(response.choices[0].message.content));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}