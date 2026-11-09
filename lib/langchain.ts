import "server-only";

import { ChatGroq } from "@langchain/groq";
import { consultarBanco } from "@/lib/sqlite-tool";

const DEFAULT_MODEL = "openai/gpt-oss-20b";

export function getChatModel() {
  const apiKey = process.env.GROQ_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY não está configurada. Defina essa variável no ambiente do servidor.",
    );
  }

  const model = new ChatGroq({
    apiKey,
    model: process.env.GROQ_MODEL?.trim() || DEFAULT_MODEL,
    temperature: 0,
  });

  return model.bindTools([consultarBanco]);
}
