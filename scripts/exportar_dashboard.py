from __future__ import annotations

import json
import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATABASE = ROOT / "output" / "hackathon_cempro.sqlite"
OUTPUT = ROOT / "lib" / "dashboard-data.json"


def rows(connection: sqlite3.Connection, query: str) -> list[dict]:
    return [dict(row) for row in connection.execute(query)]


def main() -> None:
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row

    data = {
        "monthly": rows(
            connection,
            """
            SELECT
                substr(data_abertura, 1, 7) AS mes,
                COUNT(*) AS chamados,
                SUM(status = 'Pendente') AS pendentes,
                ROUND(AVG(tempo_resolucao_min), 1) AS tempo_medio,
                ROUND(AVG(satisfacao_1_a_5), 2) AS satisfacao
            FROM atendimentos
            GROUP BY 1
            ORDER BY 1
            """,
        ),
        "usageMonthly": rows(
            connection,
            """
            SELECT
                mes,
                SUM(acessos) AS acessos,
                SUM(operacoes_realizadas) AS operacoes
            FROM uso_servicos
            GROUP BY mes
            ORDER BY mes
            """,
        ),
        "services": rows(
            connection,
            "SELECT * FROM vw_resumo_servico ORDER BY acessos DESC",
        ),
        "subjects": rows(
            connection,
            """
            SELECT
                assunto,
                COUNT(*) AS chamados,
                SUM(status = 'Pendente') AS pendentes,
                ROUND(AVG(tempo_resolucao_min), 1) AS tempo_medio,
                ROUND(
                    100.0 * SUM(satisfacao_1_a_5 <= 2)
                    / NULLIF(SUM(satisfacao_1_a_5 IS NOT NULL), 0),
                    1
                ) AS pct_notas_baixas
            FROM atendimentos
            GROUP BY assunto
            ORDER BY chamados DESC
            """,
        ),
        "channels": rows(
            connection,
            """
            SELECT
                canal,
                COUNT(*) AS chamados,
                SUM(status = 'Pendente') AS pendentes,
                ROUND(AVG(tempo_resolucao_min), 1) AS tempo_medio,
                ROUND(AVG(satisfacao_1_a_5), 2) AS satisfacao
            FROM atendimentos
            GROUP BY canal
            ORDER BY chamados DESC
            """,
        ),
        "priorities": rows(
            connection,
            """
            SELECT
                prioridade,
                COUNT(*) AS chamados,
                SUM(status = 'Pendente') AS pendentes,
                ROUND(AVG(tempo_resolucao_min), 1) AS tempo_medio,
                ROUND(AVG(satisfacao_1_a_5), 2) AS satisfacao
            FROM atendimentos
            GROUP BY prioridade
            ORDER BY CASE prioridade WHEN 'Alta' THEN 1 WHEN 'Normal' THEN 2 ELSE 3 END
            """,
        ),
        "clientsBySector": rows(
            connection,
            "SELECT setor, COUNT(*) AS clientes FROM clientes GROUP BY setor ORDER BY clientes DESC",
        ),
        "clientsBySize": rows(
            connection,
            "SELECT porte, COUNT(*) AS clientes FROM clientes GROUP BY porte ORDER BY clientes DESC",
        ),
        "clientsByCity": rows(
            connection,
            "SELECT cidade, COUNT(*) AS clientes FROM clientes GROUP BY cidade ORDER BY clientes DESC",
        ),
        "risk": rows(
            connection,
            """
            SELECT faixa_atencao, COUNT(*) AS clientes
            FROM vw_saude_cliente
            GROUP BY faixa_atencao
            ORDER BY CASE faixa_atencao WHEN 'Crítico' THEN 1 WHEN 'Atenção' THEN 2 ELSE 3 END
            """,
        ),
        "topRisk": rows(
            connection,
            """
            SELECT
                cliente_id,
                nome_ficticio,
                porte,
                setor,
                cidade,
                score_atencao,
                faixa_atencao,
                atendimentos_pendentes,
                satisfacao_media,
                tempo_medio_resolucao_min,
                taxa_operacoes_por_acesso,
                acessos_primeiro_mes,
                acessos_ultimo_mes
            FROM vw_saude_cliente
            ORDER BY score_atencao DESC, cliente_id
            LIMIT 12
            """,
        ),
        "kpis": dict(
            connection.execute(
                """
                SELECT
                    COUNT(*) AS chamados,
                    SUM(status = 'Pendente') AS pendentes,
                    ROUND(AVG(tempo_resolucao_min), 1) AS tempo_medio,
                    ROUND(AVG(satisfacao_1_a_5), 2) AS satisfacao
                FROM atendimentos
                """
            ).fetchone()
        ),
        "usage": dict(
            connection.execute(
                """
                SELECT
                    SUM(acessos) AS acessos,
                    SUM(operacoes_realizadas) AS operacoes
                FROM uso_servicos
                """
            ).fetchone()
        ),
    }

    OUTPUT.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Dados exportados para {OUTPUT}")


if __name__ == "__main__":
    main()
