"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  Clock3,
  Database,
  Gauge,
  Headphones,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  MousePointerClick,
  Send,
  SlidersHorizontal,
  Sparkles,
  Star,
  TicketCheck,
  Users,
  X,
} from "lucide-react";

import dashboardData from "@/lib/dashboard-data.json";
import {
  DonutChart,
  GroupedBars,
  HorizontalBars,
  LineChart,
  MetricCard,
  SectionTitle,
  formatNumber,
  palette,
} from "@/components/dashboard/charts";

type Month = "all" | "2026-07" | "2026-08" | "2026-09";
type Message = { role: "user" | "assistant"; content: string; offline?: boolean };

const monthLabels: Record<Month, string> = {
  all: "Todo período",
  "2026-07": "Jul",
  "2026-08": "Ago",
  "2026-09": "Set",
};

const compactContext = JSON.stringify({
  kpis: dashboardData.kpis,
  uso: dashboardData.usage,
  mensal: dashboardData.monthly,
  usoMensal: dashboardData.usageMonthly,
  servicos: dashboardData.services,
  assuntos: dashboardData.subjects,
  prioridades: dashboardData.priorities,
  canais: dashboardData.channels,
  risco: dashboardData.risk,
  clientesPrioritarios: dashboardData.topRisk.slice(0, 8),
});

function offlineAnswer(question: string) {
  const q = question.toLowerCase();
  if (q.includes("prioridade")) {
    return "A prioridade Alta não está sendo resolvida mais rápido: média de 129,8 min, contra 102,3 min na Baixa. A diferença é de 27,5 min. Isso é um sinal operacional, não uma explicação causal.";
  }
  if (q.includes("cliente") || q.includes("ligar") || q.includes("atenção")) {
    return "Comece por C048, C097, C018, C022 e C071. Eles estão na faixa Crítico pelo score de triagem. C048 e C097 têm 2 pendências cada; C071 tem satisfação média 1,5. Revise o motivo de cada sinal antes do contato.";
  }
  if (q.includes("serviço") || q.includes("produto")) {
    return "Portal Web tem o maior uso (2.924 acessos) e 82 chamados. Sistema Alfa reúne mais pendências (13), mas também a maior satisfação média (4,12). Uso e satisfação devem ser lidos separadamente.";
  }
  if (q.includes("agosto") || q.includes("julho") || q.includes("setembro") || q.includes("mês")) {
    return "Julho teve 106 chamados e 15 pendentes; agosto, 108 e 9; setembro, 86 e 16. Setembro vai somente até 29/09, por isso a comparação de backlog exige cautela.";
  }
  if (q.includes("erro") || q.includes("lentidão") || q.includes("assunto")) {
    return "Erro no sistema tem o maior tempo médio de resolução: 183,1 min. Lentidão concentra 30% de notas 1–2, a maior proporção entre os assuntos. Os dois merecem investigação técnica.";
  }
  return "O período reúne 300 chamados, 40 pendentes, tempo médio de 114,4 min, satisfação 3,8/5 e 10.783 acessos. Posso detalhar prioridade, serviços, clientes, assuntos ou evolução mensal.";
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <article className={`rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>{children}</article>;
}

export default function Home() {
  const [month, setMonth] = useState<Month>("all");
  const [chatOpen, setChatOpen] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Olá! Eu sou o assistente do Radar. Respondo usando apenas os números calculados do painel. Pergunte sobre prioridades, serviços, assuntos ou clientes.",
    },
  ]);

  const selected = useMemo(() => {
    if (month === "all") {
      return {
        chamados: dashboardData.kpis.chamados,
        pendentes: dashboardData.kpis.pendentes,
        tempo_medio: dashboardData.kpis.tempo_medio,
        satisfacao: dashboardData.kpis.satisfacao,
        acessos: dashboardData.usage.acessos,
        operacoes: dashboardData.usage.operacoes,
      };
    }
    const support = dashboardData.monthly.find((item) => item.mes === month)!;
    const usage = dashboardData.usageMonthly.find((item) => item.mes === month)!;
    return { ...support, ...usage };
  }, [month]);

  const attention = dashboardData.risk
    .filter((item) => item.faixa_atencao !== "Estável")
    .reduce((sum, item) => sum + item.clientes, 0);

  async function ask(question: string) {
    const prompt = question.trim();
    if (!prompt || loading) return;
    setInput("");
    setChatOpen(true);
    setMessages((current) => [...current, { role: "user", content: prompt }, { role: "assistant", content: "" }]);
    setLoading(true);

    try {
      const response = await fetch("/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: prompt, context: compactContext }),
      });
      if (!response.ok || !response.body) throw new Error("offline");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";
        for (const event of events) {
          const raw = event.split("\n").find((line) => line.startsWith("data:"))?.slice(5).trim();
          if (!raw || raw === "[DONE]") continue;
          const payload = JSON.parse(raw) as { content?: string; error?: string };
          if (payload.error) throw new Error(payload.error);
          if (payload.content) {
            setMessages((current) => {
              const next = [...current];
              next[next.length - 1] = { role: "assistant", content: next[next.length - 1].content + payload.content };
              return next;
            });
          }
        }
        if (done) break;
      }
    } catch {
      setMessages((current) => {
        const next = [...current];
        next[next.length - 1] = { role: "assistant", content: offlineAnswer(prompt), offline: true };
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(input);
  }

  const nav = [
    { label: "Painel do mês", icon: LayoutDashboard, href: "#painel" },
    { label: "Alertas", icon: Bell, href: "#alertas" },
    { label: "Clientes", icon: Users, href: "#clientes" },
    { label: "Grids analíticos", icon: SlidersHorizontal, href: "#analises" },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="flex min-h-screen">
        <aside className={`${mobileNav ? "flex" : "hidden"} fixed inset-y-0 left-0 z-40 w-64 flex-col border-r border-slate-200 bg-white p-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:shrink-0`}>
          <div className="flex items-center justify-between px-2 py-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-600 text-white"><Gauge className="size-5" /></div>
              <div><p className="font-semibold tracking-tight">Radar do Gestor</p><p className="text-[11px] text-slate-400">Data Cempro 2026</p></div>
            </div>
            <button className="rounded-lg p-2 text-slate-500 lg:hidden" onClick={() => setMobileNav(false)} aria-label="Fechar menu"><X className="size-5" /></button>
          </div>
          <nav className="mt-5 space-y-1">
            {nav.map(({ label, icon: Icon, href }, index) => (
              <a key={label} href={href} onClick={() => setMobileNav(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${index === 0 ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}>
                <Icon className="size-4.5" />{label}
              </a>
            ))}
          </nav>
          <div className="mt-auto rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
            <div className="mb-2 flex items-center gap-2 font-semibold text-slate-700"><Database className="size-4 text-blue-600" />Base validada</div>
            100 clientes · 300 chamados<br />Dados fictícios, jul–set/2026
          </div>
        </aside>

        {mobileNav ? <button className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden" onClick={() => setMobileNav(false)} aria-label="Fechar menu" /> : null}

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex min-h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8">
            <div className="flex items-center gap-3">
              <button className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden" onClick={() => setMobileNav(true)} aria-label="Abrir menu"><Menu className="size-5" /></button>
              <div><h1 className="text-lg font-semibold tracking-tight sm:text-xl">Painel do mês</h1><p className="hidden text-xs text-slate-500 sm:block">Fechamento operacional e saúde da carteira</p></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden rounded-lg border border-slate-200 bg-slate-50 p-1 sm:flex">
                {(Object.keys(monthLabels) as Month[]).map((key) => (
                  <button key={key} onClick={() => setMonth(key)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${month === key ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>{monthLabels[key]}</button>
                ))}
              </div>
              <button onClick={() => setChatOpen((open) => !open)} className="flex min-h-10 items-center gap-2 rounded-lg bg-blue-600 px-3.5 text-sm font-semibold text-white transition hover:bg-blue-700">
                <Sparkles className="size-4" /><span className="hidden sm:inline">Perguntar à IA</span>
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-[1380px] space-y-8 p-5 sm:p-8" id="painel">
            {month === "2026-09" || month === "all" ? (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" /><span>Dados de setembro vão até 29/09. O backlog do mês pode estar inflado.</span>
              </div>
            ) : null}

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
              <MetricCard label="Chamados" value={formatNumber(selected.chamados)} detail={month === "all" ? "260 resolvidos no período" : `Abertos em ${monthLabels[month]}`} icon={Headphones} />
              <MetricCard label="Pendentes" value={formatNumber(selected.pendentes)} detail={`${formatNumber((selected.pendentes / selected.chamados) * 100, 1)}% dos chamados`} icon={TicketCheck} tone="amber" />
              <MetricCard label="Tempo médio" value={`${formatNumber(selected.tempo_medio, 1)} min`} detail="Somente chamados resolvidos" icon={Clock3} tone="red" />
              <MetricCard label="Satisfação" value={`${formatNumber(selected.satisfacao, 2)} / 5`} detail="Avaliações válidas" icon={Star} tone="teal" />
              <MetricCard label="Acessos" value={formatNumber(selected.acessos)} detail="Uso registrado no período" icon={MousePointerClick} tone="teal" />
              <MetricCard label="Operações" value={formatNumber(selected.operacoes)} detail="Intensidade de uso" icon={BarChart3} />
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <Card>
                <SectionTitle eyebrow="Evolução" title="Chamados e pendências" description="Comparação mensal do volume de suporte." />
                <LineChart primaryLabel="Chamados" secondaryLabel="Pendentes" data={dashboardData.monthly.map((item) => ({ label: monthLabels[item.mes as Month], primary: item.chamados, secondary: item.pendentes }))} />
              </Card>
              <Card>
                <SectionTitle eyebrow="Adoção" title="Uso dos serviços" description="Acessos e operações dos 100 clientes." />
                <GroupedBars data={dashboardData.usageMonthly.map((item) => ({ label: monthLabels[item.mes as Month], first: item.acessos, second: item.operacoes }))} />
              </Card>
            </section>

            <section id="alertas" className="scroll-mt-24 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
              <Card>
                <SectionTitle eyebrow="Alertas" title="Assuntos que pressionam o suporte" description="Pendentes não entram no cálculo de tempo ou satisfação." />
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left text-sm">
                    <thead><tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-400"><th className="pb-3">Assunto</th><th className="pb-3 text-right">Chamados</th><th className="pb-3 text-right">Pendentes</th><th className="pb-3 text-right">Tempo</th><th className="pb-3 text-right">Notas 1–2</th></tr></thead>
                    <tbody>{dashboardData.subjects.map((item) => <tr key={item.assunto} className="border-b border-slate-100 last:border-0"><td className="py-3 font-medium">{item.assunto}</td><td className="py-3 text-right">{item.chamados}</td><td className="py-3 text-right font-semibold text-amber-700">{item.pendentes}</td><td className="py-3 text-right">{formatNumber(item.tempo_medio, 1)} min</td><td className="py-3 text-right font-semibold text-rose-600">{formatNumber(item.pct_notas_baixas, 1)}%</td></tr>)}</tbody>
                  </table>
                </div>
              </Card>
              <div className="grid gap-4">
                <Card><SectionTitle eyebrow="Prioridade" title="Tempo médio" /><HorizontalBars data={dashboardData.priorities.map((item) => ({ label: item.prioridade, value: item.tempo_medio, meta: `${item.chamados} chamados · n resolvidos` }))} color={palette.red} suffix=" min" /></Card>
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-5"><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Insight</p><p className="mt-2 text-sm leading-6 text-blue-950">A prioridade Alta leva 27,5 min a mais que a Baixa. Isso sugere revisar triagem e capacidade, sem afirmar causalidade.</p></div>
              </div>
            </section>

            <section id="clientes" className="scroll-mt-24 grid gap-4 xl:grid-cols-[0.65fr_1.35fr]">
              <Card><SectionTitle eyebrow="Carteira" title="Faixas de atenção" description="Score de triagem, não previsão de churn." /><DonutChart data={dashboardData.risk.map((item) => ({ label: item.faixa_atencao, value: item.clientes, color: item.faixa_atencao === "Crítico" ? palette.red : item.faixa_atencao === "Atenção" ? palette.amber : palette.teal }))} /><p className="mt-6 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500">{attention} clientes exigem revisão. O score combina pendências, satisfação, tempo e uso.</p></Card>
              <Card>
                <div className="mb-5 flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600">Ação</p><h2 className="text-xl font-semibold">Clientes prioritários</h2></div><span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">5 críticos</span></div>
                <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-400"><th className="pb-3">Cliente</th><th className="pb-3">Perfil</th><th className="pb-3 text-right">Score</th><th className="pb-3 text-right">Pendentes</th><th className="pb-3 text-right">Satisfação</th></tr></thead><tbody>{dashboardData.topRisk.slice(0, 8).map((client) => <tr key={client.cliente_id} className="border-b border-slate-100 last:border-0"><td className="py-3"><p className="font-semibold">{client.nome_ficticio}</p><p className="text-[11px] text-slate-400">{client.cliente_id} · {client.cidade}</p></td><td className="py-3 text-xs text-slate-500">{client.porte}<br />{client.setor}</td><td className="py-3 text-right"><span className={`rounded-full px-2.5 py-1 font-bold ${client.faixa_atencao === "Crítico" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{client.score_atencao}</span></td><td className="py-3 text-right font-semibold">{client.atendimentos_pendentes}</td><td className="py-3 text-right font-semibold">{client.satisfacao_media ? formatNumber(client.satisfacao_media, 2) : "—"}</td></tr>)}</tbody></table></div>
              </Card>
            </section>

            <section id="analises" className="scroll-mt-24 grid gap-4 lg:grid-cols-3">
              <Card><SectionTitle eyebrow="Canais" title="Volume de chamados" /><HorizontalBars data={dashboardData.channels.map((item) => ({ label: item.canal, value: item.chamados, meta: `${item.pendentes} pendentes · nota ${formatNumber(item.satisfacao, 2)}` }))} /></Card>
              <Card><SectionTitle eyebrow="Produtos" title="Acessos por serviço" /><HorizontalBars data={dashboardData.services.map((item) => ({ label: item.servico, value: item.acessos, meta: `${item.atendimentos} chamados · ${item.pendentes} pendentes` }))} color={palette.teal} /></Card>
              <Card><SectionTitle eyebrow="Perfil" title="Clientes por setor" /><HorizontalBars data={dashboardData.clientsBySector.map((item) => ({ label: item.setor, value: item.clientes }))} color={palette.cyan} /></Card>
            </section>

            <footer className="border-t border-slate-200 py-5 text-xs text-slate-400">Dados sintéticos · Jul–Set 2026 · Correlação não implica causalidade · Números calculados a partir do SQLite</footer>
          </div>
        </div>

        {chatOpen ? (
          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[390px] flex-col border-l border-slate-200 bg-white shadow-[-18px_0_55px_rgba(15,23,42,0.12)] sm:w-[390px]">
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4">
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><Bot className="size-5" /></div>
              <div className="flex-1"><h2 className="font-semibold">Assistente do Radar</h2><p className="text-[11px] text-slate-400">IA com fallback offline · fontes do painel</p></div>
              <button onClick={() => setChatOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Fechar assistente"><X className="size-5" /></button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
              {messages.map((message, index) => (
                <div key={index} className={message.role === "user" ? "ml-auto max-w-[88%] rounded-xl rounded-br-sm bg-blue-600 px-3.5 py-2.5 text-sm leading-6 text-white" : "max-w-[94%] rounded-xl rounded-bl-sm border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-700"}>
                  {message.offline ? <span className="mb-2 block w-fit rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">Modo offline</span> : null}
                  {message.content || (loading && index === messages.length - 1 ? "Analisando os números…" : "")}
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 p-4">
              <div className="mb-3 flex flex-wrap gap-1.5">
                {["Como foi agosto?", "Quais clientes priorizar?", "A prioridade Alta é mais rápida?"].map((question) => <button key={question} onClick={() => void ask(question)} className="rounded-full border border-slate-200 px-2.5 py-1.5 text-[11px] text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">{question}</button>)}
              </div>
              <form onSubmit={submit} className="flex gap-2">
                <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Pergunte sobre os números…" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                <button type="submit" disabled={loading || !input.trim()} className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white disabled:opacity-40" aria-label="Enviar pergunta"><Send className="size-4" /></button>
              </form>
              <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-400"><MessageSquareText className="size-3" />Números vêm do SQL; a IA apenas interpreta.</p>
            </div>
          </aside>
        ) : (
          <button onClick={() => setChatOpen(true)} className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-xl hover:bg-blue-700"><Sparkles className="size-4" />Assistente</button>
        )}
      </div>
    </main>
  );
}
