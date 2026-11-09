import "server-only";

import { ChatOpenAI } from "@langchain/openai";

const DEFAULT_MODEL = "gpt-4o-mini";

export function getChatModel() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY não está configurada. Defina essa variável no ambiente do servidor.",
    );
  }

  return new ChatOpenAI({
    apiKey,
    model: process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL,
    temperature: 0,
  });
}
