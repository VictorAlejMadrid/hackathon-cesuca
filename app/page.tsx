import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-3xl rounded-2xl border border-border bg-card shadow-sm">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Chat</p>
            <h1 className="text-xl font-semibold">CESUCA Assist</h1>
          </div>
          <Button variant="outline" size="sm">
            Nova conversa
          </Button>
        </header>

        <section className="space-y-4 px-5 py-6">
          <div className="max-w-lg rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
            Olá! Posso ajudar com ideias, organização e respostas rápidas.
          </div>

          <div className="ml-auto max-w-lg rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground">
            Vamos montar a estrutura do chat do nosso monorepo com shadcn/ui.
          </div>

          <div className="max-w-lg rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
            Posso começar alinhando a base visual, componentes e fluxos de conversa.
          </div>
        </section>

        <form className="flex gap-3 border-t border-border px-5 py-4">
          <input
            aria-label="Mensagem"
            placeholder="Digite sua mensagem..."
            className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none ring-0 placeholder:text-muted-foreground focus:border-ring"
          />
          <Button type="submit">Enviar</Button>
        </form>
      </div>
    </main>
  );
}
