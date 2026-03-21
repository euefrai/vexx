import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    // Agora recebemos o array 'historico' do frontend
    const { historico } = await req.json(); 

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é o COMANDANTE do VEXX SQUAD. 
          - Você tem memória das mensagens anteriores para manter o contexto.
          - Se o usuário falar de um treino ou suplemento citado antes, você sabe do que ele está falando.
          - Mantenha o tom militar, direto e técnico.`
        },
        ...historico // Injeta todas as mensagens anteriores aqui
      ],
    });

    return NextResponse.json({ resposta: response.choices[0].message.content });
  } catch (err) {
    return NextResponse.json({ error: "Erro na base" }, { status: 500 });
  }
}