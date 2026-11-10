import "server-only";

import type Database from "better-sqlite3";
import { getDatabase } from "@/lib/db";
import type { DashboardData } from "@/types/dashboard";

function rows<T>(database: Database.Database, query: string): T[] {
  return database.prepare(query).all() as T[];
}

function one<T>(database: Database.Database, query: string): T {
  return database.prepare(query).get() as T;
}

export function getDashboardData(): DashboardData {
  const database = getDatabase();

  return {
    monthly: rows(database, `
      SELECT
        substr(data_abertura, 1, 7) AS mes,
        COUNT(*) AS chamados,
        SUM(status = 'Resolvido') AS resolvidos,
        SUM(status = 'Pendente') AS pendentes,
        ROUND(AVG(tempo_resolucao_min), 1) AS tempo_medio,
        ROUND(AVG(satisfacao_1_a_5), 2) AS satisfacao
      FROM atendimentos
      GROUP BY 1
      ORDER BY 1
    `),
    usageMonthly: rows(database, `
      SELECT mes, SUM(acessos) AS acessos, SUM(operacoes_realizadas) AS operacoes
      FROM uso_servicos
      GROUP BY mes
      ORDER BY mes
    `),
    services: rows(database, "SELECT * FROM vw_resumo_servico ORDER BY acessos DESC"),
    subjects: rows(database, `
      SELECT
        assunto,
        COUNT(*) AS chamados,
        SUM(status = 'Pendente') AS pendentes,
        ROUND(AVG(tempo_resolucao_min), 1) AS tempo_medio,
        ROUND(100.0 * SUM(satisfacao_1_a_5 <= 2) /
          NULLIF(SUM(satisfacao_1_a_5 IS NOT NULL), 0), 1) AS pct_notas_baixas
      FROM atendimentos
      GROUP BY assunto
      ORDER BY chamados DESC
    `),
    channels: rows(database, `
      SELECT
        canal,
        COUNT(*) AS chamados,
        SUM(status = 'Pendente') AS pendentes,
        ROUND(AVG(tempo_resolucao_min), 1) AS tempo_medio,
        ROUND(AVG(satisfacao_1_a_5), 2) AS satisfacao
      FROM atendimentos
      GROUP BY canal
      ORDER BY chamados DESC
    `),
    priorities: rows(database, `
      SELECT
        prioridade,
        COUNT(*) AS chamados,
        SUM(status = 'Pendente') AS pendentes,
        ROUND(AVG(tempo_resolucao_min), 1) AS tempo_medio,
        ROUND(AVG(satisfacao_1_a_5), 2) AS satisfacao
      FROM atendimentos
      GROUP BY prioridade
      ORDER BY CASE prioridade WHEN 'Alta' THEN 1 WHEN 'Normal' THEN 2 ELSE 3 END
    `),
    clientsBySector: rows(database, "SELECT setor, COUNT(*) AS clientes FROM clientes GROUP BY setor ORDER BY clientes DESC"),
    clientsBySize: rows(database, "SELECT porte, COUNT(*) AS clientes FROM clientes GROUP BY porte ORDER BY clientes DESC"),
    clientsByCity: rows(database, "SELECT cidade, COUNT(*) AS clientes FROM clientes GROUP BY cidade ORDER BY clientes DESC"),
    risk: rows(database, `
      SELECT faixa_atencao, COUNT(*) AS clientes
      FROM vw_saude_cliente
      GROUP BY faixa_atencao
      ORDER BY CASE faixa_atencao WHEN 'Crítico' THEN 1 WHEN 'Atenção' THEN 2 ELSE 3 END
    `),
    topRisk: rows(database, `
      SELECT
        cliente_id, nome_ficticio, porte, setor, cidade, score_atencao,
        faixa_atencao, atendimentos_pendentes, satisfacao_media,
        tempo_medio_resolucao_min, taxa_operacoes_por_acesso,
        acessos_primeiro_mes, acessos_ultimo_mes
      FROM vw_saude_cliente
      ORDER BY score_atencao DESC, cliente_id
      LIMIT 12
    `),
    kpis: one(database, `
      SELECT
        COUNT(*) AS chamados,
        SUM(status = 'Resolvido') AS resolvidos,
        SUM(status = 'Pendente') AS pendentes,
        ROUND(AVG(tempo_resolucao_min), 1) AS tempo_medio,
        ROUND(AVG(satisfacao_1_a_5), 2) AS satisfacao
      FROM atendimentos
    `),
    criticalClients: one(database, `
      SELECT COUNT(*) AS clientes
      FROM vw_saude_cliente
      WHERE faixa_atencao = 'Crítico'
    `),
    usage: one(database, `
      SELECT SUM(acessos) AS acessos, SUM(operacoes_realizadas) AS operacoes
      FROM uso_servicos
    `),
  };
}
