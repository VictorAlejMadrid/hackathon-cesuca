"use client";

import { FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type StreamEvent = {
  content?: string;
  error?: string;
};

const initialMessages: Message[] = [
  {
    role: "assistant",
    content: "Olá! Posso ajudar com ideias, organização e respostas rápidas.",
  },
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const prompt = input.trim();
    if (!prompt || isLoading) {
      return;
    }

    setInput("");
    setError(null);
    setMessages((current) => [
      ...current,
      { role: "user", content: prompt },
      { role: "assistant", content: "" },
    ]);
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: prompt }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error || "Não foi possível enviar a mensagem.");
      }

      if (!response.body) {
        throw new Error("A resposta do servidor não contém um fluxo.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const appendAssistantContent = (content: string) => {
        setMessages((current) => {
          const next = [...current];
          const lastMessage = next[next.length - 1];

          if (lastMessage?.role === "assistant") {
            next[next.length - 1] = {
              ...lastMessage,
              content: lastMessage.content + content,
            };
          }

          return next;
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const eventText of events) {
          const data = eventText
            .split("\n")
            .find((line) => line.startsWith("data:"))
            ?.slice(5)
            .trim();

          if (!data) {
            continue;
          }

          if (data === "[DONE]") {
            break;
          }

          const event = JSON.parse(data) as StreamEvent;
          if (event.error) {
            throw new Error(event.error);
          }
          if (event.content) {
            appendAssistantContent(event.content);
          }
        }

        if (done) {
          break;
        }
      }
    } catch (caughtError) {
      if ((caughtError as Error).name !== "AbortError") {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Ocorreu um erro ao enviar a mensagem.";
        setError(message);
        setMessages((current) => {
          const last = current[current.length - 1];
          return last?.role === "assistant" && !last.content
            ? current.slice(0, -1)
            : current;
        });
      }
    } finally {
      abortRef.current = null;
      setIsLoading(false);
    }
  }

  function handleNewConversation() {
    abortRef.current?.abort();
    setMessages(initialMessages);
    setInput("");
    setError(null);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-3xl rounded-2xl border border-border bg-card shadow-sm">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Chat</p>
            <h1 className="text-xl font-semibold">CESUCA Assist</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={handleNewConversation}
          >
            Nova conversa
          </Button>
        </header>

        <section className="space-y-4 px-5 py-6">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={
                message.role === "user"
                  ? "ml-auto max-w-lg rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground"
                  : "max-w-lg whitespace-pre-wrap rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground"
              }
            >
              {message.content ||
                (isLoading && index === messages.length - 1
                  ? "..."
                  : null)}
            </div>
          ))}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </section>

        <form
          className="flex gap-3 border-t border-border px-5 py-4"
          onSubmit={handleSubmit}
        >
          <input
            aria-label="Mensagem"
            placeholder="Digite sua mensagem..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none ring-0 placeholder:text-muted-foreground focus:border-ring"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? "Enviando..." : "Enviar"}
          </Button>
        </form>
      </div>
    </main>
  );
}
