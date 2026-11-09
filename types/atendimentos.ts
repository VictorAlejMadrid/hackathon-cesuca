export type StatusAtendimento = "Resolvido" | "Pendente";
export type PrioridadeAtendimento = "Baixa" | "Normal" | "Alta";

export interface Atendimento {
  atendimento_id: string;
  cliente_id: string;
  data_abertura: string;
  servico: string;
  assunto: string;
  canal: string;
  prioridade: PrioridadeAtendimento;
  status: StatusAtendimento;
  tempo_resolucao_min: number | null;
  satisfacao_1_a_5: number | null;
}
