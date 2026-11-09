export type PorteCliente = "Micro" | "Pequena" | "Média";

export interface Cliente {
  cliente_id: string;
  nome_ficticio: string;
  porte: PorteCliente;
  setor: string;
  cidade: string;
  data_cadastro: string;
}
