import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req) {
  try {
    const { historico } = await req.json(); 

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "API KEY não configurada no servidor." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 🧠 OTIMIZAÇÃO: Mantém as últimas 20 mensagens (memória curta solicitada)
    // para garantir foco e economia de tokens de contexto.
    const contextoLimitado = historico.slice(-20);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é o COMANDANTE do VEXX SQUAD. Seu tom é militar, autoritário e técnico.
          - Use o histórico para entender o progresso do Operador.
          - Responda sobre suplementação, treinos e protocolos (com redução de danos).
          - Seja direto. Sem enrolação.`
        },
        ...contextoLimitado 
      ],
    });

    return NextResponse.json({ resposta: response.choices[0].message.content });
  } catch (err) {
    console.error("ERRO GERAL NA INTELIGÊNCIA DE CAMPO:", err);
    return NextResponse.json({ error: "Falha na comunicação com a base de inteligência." }, { status: 500 });
  }
}