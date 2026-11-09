import { getChatModel } from "@/lib/langchain";
import {
  consultarBanco,
  consultarBancoInputSchema,
} from "@/lib/sqlite-tool";
import {
  BaseMessage,
  HumanMessage,
  ToolMessage,
} from "@langchain/core/messages";

const encoder = new TextEncoder();

function sseEvent(payload: unknown) {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

function contentToString(content: unknown) {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((part) => {
      if (typeof part === "string") {
        return part;
      }

      if (part && typeof part === "object" && "text" in part) {
        const text = part.text;
        return typeof text === "string" ? text : "";
      }

      return "";
    })
    .join("");
}

export async function POST(request: Request) {
  let input: unknown;

  try {
    const body: unknown = await request.json();
    input =
      typeof body === "string" ||
      (body !== null &&
        typeof body === "object" &&
        "input" in body &&
        typeof body.input === "string")
        ? typeof body === "string"
          ? body
          : body.input
        : undefined;
  } catch {
    return Response.json(
      { error: "O corpo da requisição deve ser um JSON válido." },
      { status: 400 },
    );
  }

  if (typeof input !== "string" || !input.trim()) {
    return Response.json(
      { error: 'Informe uma string não vazia no campo "input".' },
      { status: 400 },
    );
  }

  const prompt = input.trim();
  let model;

  try {
    model = getChatModel();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível iniciar o modelo.";
    return Response.json({ error: message }, { status: 500 });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const firstResponse = await model.invoke(prompt, {
          signal: request.signal,
        });

        const toolCalls =
          "tool_calls" in firstResponse && Array.isArray(firstResponse.tool_calls)
            ? firstResponse.tool_calls
            : [];
        let response = firstResponse;

        if (toolCalls.length > 0) {
          const toolMessages = await Promise.all(
            toolCalls.map(async (call) => {
              const result = await consultarBanco.invoke(
                consultarBancoInputSchema.parse(call.args),
              );
              return new ToolMessage({
                content: result,
                tool_call_id: call.id || call.name,
              });
            }),
          );

          const messages: BaseMessage[] = [
            new HumanMessage(prompt),
            firstResponse,
            ...toolMessages,
          ];
          response = await model.invoke(
            messages,
            { signal: request.signal },
          );
        }

        const content = contentToString(response.content);
        if (content && !request.signal.aborted) {
          controller.enqueue(sseEvent({ content }));
        }

        if (!request.signal.aborted) {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      } catch (error) {
        if (request.signal.aborted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Erro ao gerar resposta do modelo.";
        controller.enqueue(sseEvent({ error: message }));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
    },
  });
}
