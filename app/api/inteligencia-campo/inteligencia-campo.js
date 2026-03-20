import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const { mensagem } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é o COMANDANTE do VEXX SQUAD. Seu tom é militar, direto, técnico e autoritário.
          - Responda sobre SUPLEMENTAÇÃO com foco em performance real.
          - Se o usuário perguntar sobre ANABOLIZANTES/ESTEROIDES: Fale tecnicamente sobre as substâncias (mecanismo de ação), mas sempre mencione os riscos colaterais (eixo HPTA, fígado, coração) e a necessidade de exames de sangue. Nunca incentive o uso, mas forneça inteligência de campo baseada em fatos para redução de danos.
          - Suas respostas devem ser curtas e impactantes.`
        },
        { role: "user", content: mensagem }
      ],
    });

    return NextResponse.json({ resposta: response.choices[0].message.content });
  } catch (err) {
    return NextResponse.json({ error: "Erro na base" }, { status: 500 });
  }
}