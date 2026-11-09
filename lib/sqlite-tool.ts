import "server-only";

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getDatabase } from "@/lib/db";

export const consultarBancoInputSchema = z.object({
  consulta: z.enum([
    "resumo_geral",
    "resumo_mes",
    "top_assuntos",
    "clientes_atencao",
  ]),
  mes: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "O mês deve estar no formato AAAA-MM.")
    .optional(),
  limite: z.number().int().min(1).max(20).optional(),
});

type QueryInput = z.infer<typeof consultarBancoInputSchema>;

function queryDatabase({ consulta, mes, limite = 10 }: QueryInput) {
  const db = getDatabase();

  switch (consulta) {
    case "resumo_geral":
      return db
        .prepare(
          `SELECT
             (SELECT COUNT(*) FROM clientes) AS clientes,
             COUNT(*) AS atendimentos,
             SUM(status = 'Pendente') AS pendentes,
             ROUND(100.0 * SUM(status = 'Pendente') / COUNT(*), 1) AS percentual_pendente,
             ROUND(AVG(tempo_resolucao_min), 1) AS tempo_medio_resolucao_min,
             ROUND(AVG(satisfacao_1_a_5), 2) AS satisfacao_media
           FROM atendimentos`,
        )
        .get();

    case "resumo_mes": {
      if (!mes) {
        throw new Error("Informe o campo mes para consultar um mês.");
      }

      return db
        .prepare(
          `SELECT
             COUNT(*) AS atendimentos,
             SUM(status = 'Pendente') AS pendentes,
             SUM(status = 'Resolvido') AS resolvidos,
             ROUND(AVG(tempo_resolucao_min), 1) AS tempo_medio_resolucao_min,
             ROUND(AVG(satisfacao_1_a_5), 2) AS satisfacao_media
           FROM atendimentos
           WHERE substr(data_abertura, 1, 7) = ?`,
        )
        .get(mes);
    }

    case "top_assuntos":
      return db
        .prepare(
          `SELECT assunto, prioridade, COUNT(*) AS quantidade
           FROM atendimentos
           WHERE status = 'Pendente'
           GROUP BY assunto, prioridade
           ORDER BY quantidade DESC, assunto, prioridade
           LIMIT ?`,
        )
        .all(limite);

    case "clientes_atencao":
      return db
        .prepare(
          `SELECT
             cliente_id, nome_ficticio, faixa_atencao, score_atencao,
             atendimentos_pendentes, satisfacao_media,
             acessos_primeiro_mes, acessos_ultimo_mes
           FROM vw_saude_cliente
           ORDER BY score_atencao DESC, atendimentos_pendentes DESC, cliente_id
           LIMIT ?`,
        )
        .all(limite);
  }
}

export const consultarBanco = tool(
  async (input) => JSON.stringify(queryDatabase(input)),
  {
    name: "consultar_banco",
    description:
      "Consulta indicadores agregados do banco SQLite. Use esta ferramenta antes de responder perguntas sobre os dados. Nunca invente números.",
    schema: consultarBancoInputSchema,
  },
);
