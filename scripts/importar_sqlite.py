from __future__ import annotations

import argparse
import sqlite3
from pathlib import Path

import pandas as pd


SCHEMA = """
PRAGMA foreign_keys = ON;

CREATE TABLE clientes (
    cliente_id TEXT PRIMARY KEY,
    nome_ficticio TEXT NOT NULL,
    porte TEXT NOT NULL CHECK (porte IN ('Micro', 'Pequena', 'Média')),
    setor TEXT NOT NULL,
    cidade TEXT NOT NULL,
    data_cadastro TEXT NOT NULL CHECK (data_cadastro GLOB '????-??-??')
);

CREATE TABLE atendimentos (
    atendimento_id TEXT PRIMARY KEY,
    cliente_id TEXT NOT NULL,
    data_abertura TEXT NOT NULL,
    servico TEXT NOT NULL,
    assunto TEXT NOT NULL,
    canal TEXT NOT NULL,
    prioridade TEXT NOT NULL CHECK (prioridade IN ('Baixa', 'Normal', 'Alta')),
    status TEXT NOT NULL CHECK (status IN ('Resolvido', 'Pendente')),
    tempo_resolucao_min INTEGER CHECK (tempo_resolucao_min >= 0),
    satisfacao_1_a_5 INTEGER CHECK (satisfacao_1_a_5 BETWEEN 1 AND 5),
    FOREIGN KEY (cliente_id) REFERENCES clientes(cliente_id),
    CHECK (
        (status = 'Pendente' AND tempo_resolucao_min IS NULL AND satisfacao_1_a_5 IS NULL)
        OR
        (status = 'Resolvido' AND tempo_resolucao_min IS NOT NULL AND satisfacao_1_a_5 IS NOT NULL)
    )
);

CREATE TABLE uso_servicos (
    cliente_id TEXT NOT NULL,
    mes TEXT NOT NULL CHECK (mes GLOB '????-??'),
    servico TEXT NOT NULL,
    acessos INTEGER NOT NULL CHECK (acessos >= 0),
    operacoes_realizadas INTEGER NOT NULL CHECK (operacoes_realizadas >= 0),
    PRIMARY KEY (cliente_id, mes, servico),
    FOREIGN KEY (cliente_id) REFERENCES clientes(cliente_id)
);

CREATE TABLE metadados_importacao (
    chave TEXT PRIMARY KEY,
    valor TEXT NOT NULL
);

CREATE INDEX idx_atendimentos_cliente ON atendimentos(cliente_id);
CREATE INDEX idx_atendimentos_data ON atendimentos(data_abertura);
CREATE INDEX idx_atendimentos_status_prioridade ON atendimentos(status, prioridade);
CREATE INDEX idx_atendimentos_servico ON atendimentos(servico);
CREATE INDEX idx_uso_mes ON uso_servicos(mes);
CREATE INDEX idx_uso_servico ON uso_servicos(servico);

CREATE VIEW vw_resumo_servico AS
WITH suporte AS (
    SELECT
        servico,
        COUNT(*) AS atendimentos,
        SUM(status = 'Pendente') AS pendentes,
        ROUND(AVG(tempo_resolucao_min), 1) AS tempo_medio_resolucao_min,
        ROUND(AVG(satisfacao_1_a_5), 2) AS satisfacao_media
    FROM atendimentos
    GROUP BY servico
),
uso AS (
    SELECT
        servico,
        COUNT(DISTINCT cliente_id) AS clientes_ativos,
        SUM(acessos) AS acessos,
        SUM(operacoes_realizadas) AS operacoes,
        ROUND(1.0 * SUM(operacoes_realizadas) / NULLIF(SUM(acessos), 0), 4) AS taxa_operacoes_por_acesso
    FROM uso_servicos
    GROUP BY servico
)
SELECT
    u.servico,
    u.clientes_ativos,
    u.acessos,
    u.operacoes,
    u.taxa_operacoes_por_acesso,
    COALESCE(s.atendimentos, 0) AS atendimentos,
    COALESCE(s.pendentes, 0) AS pendentes,
    s.tempo_medio_resolucao_min,
    s.satisfacao_media
FROM uso u
LEFT JOIN suporte s USING (servico);

CREATE VIEW vw_saude_cliente AS
WITH suporte AS (
    SELECT
        cliente_id,
        COUNT(*) AS total_atendimentos,
        SUM(status = 'Pendente') AS atendimentos_pendentes,
        SUM(CASE WHEN satisfacao_1_a_5 <= 2 THEN 1 ELSE 0 END) AS avaliacoes_baixas,
        AVG(satisfacao_1_a_5) AS satisfacao_media,
        AVG(tempo_resolucao_min) AS tempo_medio_resolucao_min
    FROM atendimentos
    GROUP BY cliente_id
),
uso AS (
    SELECT
        cliente_id,
        SUM(acessos) AS acessos,
        SUM(operacoes_realizadas) AS operacoes,
        1.0 * SUM(operacoes_realizadas) / NULLIF(SUM(acessos), 0) AS taxa_operacoes_por_acesso
    FROM uso_servicos
    GROUP BY cliente_id
),
mensal AS (
    SELECT cliente_id, mes, SUM(acessos) AS acessos
    FROM uso_servicos
    GROUP BY cliente_id, mes
),
tendencia AS (
    SELECT
        cliente_id,
        MAX(CASE WHEN mes = (SELECT MIN(mes) FROM uso_servicos) THEN acessos END) AS acessos_primeiro_mes,
        MAX(CASE WHEN mes = (SELECT MAX(mes) FROM uso_servicos) THEN acessos END) AS acessos_ultimo_mes
    FROM mensal
    GROUP BY cliente_id
),
metricas AS (
    SELECT
        c.cliente_id,
        c.nome_ficticio,
        c.porte,
        c.setor,
        c.cidade,
        COALESCE(s.total_atendimentos, 0) AS total_atendimentos,
        COALESCE(s.atendimentos_pendentes, 0) AS atendimentos_pendentes,
        COALESCE(s.avaliacoes_baixas, 0) AS avaliacoes_baixas,
        ROUND(s.satisfacao_media, 2) AS satisfacao_media,
        ROUND(s.tempo_medio_resolucao_min, 1) AS tempo_medio_resolucao_min,
        COALESCE(u.acessos, 0) AS acessos,
        COALESCE(u.operacoes, 0) AS operacoes,
        ROUND(u.taxa_operacoes_por_acesso, 4) AS taxa_operacoes_por_acesso,
        t.acessos_primeiro_mes,
        t.acessos_ultimo_mes
    FROM clientes c
    LEFT JOIN suporte s USING (cliente_id)
    LEFT JOIN uso u USING (cliente_id)
    LEFT JOIN tendencia t USING (cliente_id)
),
pontuado AS (
    SELECT
        *,
        MIN(100,
            atendimentos_pendentes * 15
            + avaliacoes_baixas * 8
            + CASE WHEN satisfacao_media < 3 THEN 20 WHEN satisfacao_media < 3.5 THEN 10 ELSE 0 END
            + CASE WHEN tempo_medio_resolucao_min > 180 THEN 10 ELSE 0 END
            + CASE WHEN taxa_operacoes_por_acesso < 0.25 THEN 15 WHEN taxa_operacoes_por_acesso < 0.40 THEN 8 ELSE 0 END
            + CASE WHEN acessos_primeiro_mes > 0 AND acessos_ultimo_mes < acessos_primeiro_mes * 0.70 THEN 15 ELSE 0 END
        ) AS score_atencao
    FROM metricas
)
SELECT
    *,
    CASE
        WHEN score_atencao >= 50 THEN 'Crítico'
        WHEN score_atencao >= 25 THEN 'Atenção'
        ELSE 'Estável'
    END AS faixa_atencao
FROM pontuado;
"""


def carregar_planilha(caminho: Path, aba: str) -> pd.DataFrame:
    return pd.read_excel(caminho, sheet_name=aba, dtype_backend="numpy_nullable")


def inteiro_ou_nulo(valor):
    return None if pd.isna(valor) else int(valor)


def validar_dados(clientes: pd.DataFrame, atendimentos: pd.DataFrame, uso: pd.DataFrame) -> None:
    if clientes["cliente_id"].duplicated().any():
        raise ValueError("cliente_id duplicado em clientes.xlsx")
    if atendimentos["atendimento_id"].duplicated().any():
        raise ValueError("atendimento_id duplicado em atendimentos.xlsx")
    if uso[["cliente_id", "mes", "servico"]].duplicated().any():
        raise ValueError("Chave cliente_id + mes + servico duplicada em uso_servicos.xlsx")

    ids = set(clientes["cliente_id"])
    orfaos_atendimento = set(atendimentos["cliente_id"]) - ids
    orfaos_uso = set(uso["cliente_id"]) - ids
    if orfaos_atendimento or orfaos_uso:
        raise ValueError(
            f"Clientes ausentes: atendimentos={sorted(orfaos_atendimento)}, uso={sorted(orfaos_uso)}"
        )


def importar(pasta_dados: Path, banco: Path) -> None:
    clientes = carregar_planilha(pasta_dados / "clientes.xlsx", "clientes")
    atendimentos = carregar_planilha(pasta_dados / "atendimentos.xlsx", "atendimentos")
    uso = carregar_planilha(pasta_dados / "uso_servicos.xlsx", "uso_servicos")
    validar_dados(clientes, atendimentos, uso)

    banco.parent.mkdir(parents=True, exist_ok=True)
    banco.unlink(missing_ok=True)

    with sqlite3.connect(banco) as con:
        con.executescript(SCHEMA)
        con.executemany(
            "INSERT INTO clientes VALUES (?, ?, ?, ?, ?, ?)",
            (
                (
                    r.cliente_id,
                    r.nome_ficticio,
                    r.porte,
                    r.setor,
                    r.cidade,
                    pd.Timestamp(r.data_cadastro).strftime("%Y-%m-%d"),
                )
                for r in clientes.itertuples(index=False)
            ),
        )
        con.executemany(
            "INSERT INTO atendimentos VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                (
                    r.atendimento_id,
                    r.cliente_id,
                    str(r.data_abertura),
                    r.servico,
                    r.assunto,
                    r.canal,
                    r.prioridade,
                    r.status,
                    inteiro_ou_nulo(r.tempo_resolucao_min),
                    inteiro_ou_nulo(r.satisfacao_1_a_5),
                )
                for r in atendimentos.itertuples(index=False)
            ),
        )
        con.executemany(
            "INSERT INTO uso_servicos VALUES (?, ?, ?, ?, ?)",
            (
                (r.cliente_id, r.mes, r.servico, int(r.acessos), int(r.operacoes_realizadas))
                for r in uso.itertuples(index=False)
            ),
        )
        con.executemany(
            "INSERT INTO metadados_importacao VALUES (?, ?)",
            [
                ("origem", "Planilhas sintéticas do Hackathon Data Cempro 2026"),
                ("clientes_importados", str(len(clientes))),
                ("atendimentos_importados", str(len(atendimentos))),
                ("usos_importados", str(len(uso))),
                ("observacao", "O score é uma heurística de priorização; não implica causalidade."),
            ],
        )
        erros_fk = con.execute("PRAGMA foreign_key_check").fetchall()
        if erros_fk:
            raise ValueError(f"Falha de integridade referencial: {erros_fk}")
        con.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description="Importa as planilhas do hackathon para SQLite.")
    parser.add_argument("--dados", type=Path, default=Path("data"))
    parser.add_argument("--banco", type=Path, default=Path("output/hackathon_cempro.sqlite"))
    args = parser.parse_args()
    importar(args.dados, args.banco)
    print(f"Banco criado: {args.banco.resolve()}")


if __name__ == "__main__":
    main()
