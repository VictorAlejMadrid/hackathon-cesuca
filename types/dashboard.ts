export type DashboardData = {
  monthly: Array<{
    mes: string;
    chamados: number;
    resolvidos: number;
    pendentes: number;
    tempo_medio: number | null;
    satisfacao: number | null;
  }>;
  usageMonthly: Array<{
    mes: string;
    acessos: number;
    operacoes: number;
  }>;
  services: Array<{
    servico: string;
    clientes_ativos: number;
    acessos: number;
    operacoes: number;
    atendimentos: number;
    pendentes: number;
  }>;
  subjects: Array<{
    assunto: string;
    chamados: number;
    pendentes: number;
    tempo_medio: number | null;
    pct_notas_baixas: number | null;
  }>;
  channels: Array<{
    canal: string;
    chamados: number;
    pendentes: number;
    tempo_medio: number | null;
    satisfacao: number | null;
  }>;
  priorities: Array<{
    prioridade: string;
    chamados: number;
    pendentes: number;
    tempo_medio: number | null;
    satisfacao: number | null;
  }>;
  clientsBySector: Array<{ setor: string; clientes: number }>;
  clientsBySize: Array<{ porte: string; clientes: number }>;
  clientsByCity: Array<{ cidade: string; clientes: number }>;
  risk: Array<{ faixa_atencao: string; clientes: number }>;
  topRisk: Array<{
    cliente_id: string;
    nome_ficticio: string;
    porte: string;
    setor: string;
    cidade: string;
    score_atencao: number;
    faixa_atencao: string;
    atendimentos_pendentes: number;
    satisfacao_media: number | null;
    tempo_medio_resolucao_min: number | null;
    taxa_operacoes_por_acesso: number | null;
    acessos_primeiro_mes: number;
    acessos_ultimo_mes: number;
  }>;
  kpis: {
    chamados: number;
    resolvidos: number;
    pendentes: number;
    tempo_medio: number | null;
    satisfacao: number | null;
  };
  usage: {
    acessos: number;
    operacoes: number;
  };
  criticalClients: {
    clientes: number;
  };
};
