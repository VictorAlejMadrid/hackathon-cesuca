import { getChatModel } from '@/lib/langchain';
import { consultarBanco } from '@/lib/sqlite-tool';
import { BaseMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';

const encoder = new TextEncoder();

function sseEvent(payload: unknown) {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

function contentToString(content: unknown) {
  if (typeof content === 'string') {
    return content;
  }

  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map((part) => {
      if (typeof part === 'string') {
        return part;
      }

      if (part && typeof part === 'object' && 'text' in part) {
        const text = part.text;
        return typeof text === 'string' ? text : '';
      }

      return '';
    })
    .join('');
}

export async function POST(request: Request) {
  let input: unknown;
  let context = '';

  try {
    const body: unknown = await request.json();
    input =
      typeof body === 'string' || (body !== null && typeof body === 'object' && 'input' in body && typeof body.input === 'string')
        ? typeof body === 'string'
          ? body
          : body.input
        : undefined;
    if (body !== null && typeof body === 'object' && 'context' in body && typeof body.context === 'string') {
      context = body.context.slice(0, 12000);
    }
  } catch {
    return Response.json({ error: 'O corpo da requisição deve ser um JSON válido.' }, { status: 400 });
  }

  if (typeof input !== 'string' || !input.trim()) {
    return Response.json({ error: 'Informe uma string não vazia no campo "input".' }, { status: 400 });
  }

  const prompt = input.trim();
  const currentDate = new Date().toISOString().slice(0, 10);
  let model;

  try {
    model = getChatModel();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível iniciar o modelo.';
    return Response.json({ error: message }, { status: 500 });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const systemPrompt = `Você é o assistente analítico do LIA.
Responda em português do Brasil, de forma direta, com a conclusão primeiro.
A data atual do servidor é ${currentDate}. Use essa data como referência para perguntas sobre idade ou período.
Para perguntas sobre chamados com mais de N meses, consulte o banco usando date(data_abertura) < date('${currentDate}', '-N months').
Use exclusivamente os números do banco ou do CONTEXTO abaixo. Nunca invente ou recalcule dados ausentes.
Não afirme causalidade: use termos como "associado", "coincide" ou "sugere investigar".
Quando houver comparação, mencione os valores e a população quando disponível.
Avise que setembro de 2026 contém dados somente até 29/09 quando a resposta envolver esse mês.
Se a pergunta não puder ser respondida pelos dados, diga claramente que a informação não existe.

CONTEXTO CALCULADO PELO SQLITE:
${context || 'Nenhum contexto fornecido.'}`;

        const messages: BaseMessage[] = [new SystemMessage(systemPrompt), new HumanMessage(prompt)];
        let response = await model.invoke(messages, { signal: request.signal });

        for (let attempt = 0; attempt < 3 && response.tool_calls?.length; attempt += 1) {
          messages.push(response);
          for (const toolCall of response.tool_calls) {
            if (toolCall.name !== 'consultar_banco' || typeof toolCall.args.sql !== 'string') {
              throw new Error('O agente solicitou uma ferramenta inválida.');
            }

            const result = await consultarBanco.invoke({ sql: toolCall.args.sql });
            messages.push(new ToolMessage({ content: result, tool_call_id: toolCall.id ?? '' }));
          }
          response = await model.invoke(messages, { signal: request.signal });
        }

        if (response.tool_calls?.length) {
          throw new Error('Não foi possível concluir a consulta solicitada.');
        }

        if (!request.signal.aborted) {
          const content = contentToString(response.content);
          if (content) {
            controller.enqueue(sseEvent({ content }));
          }
        }

        if (!request.signal.aborted) {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      } catch (error) {
        if (request.signal.aborted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Erro ao gerar resposta do modelo.';
        controller.enqueue(sseEvent({ error: message }));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream; charset=utf-8',
    },
  });
}
