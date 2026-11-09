from __future__ import annotations

import argparse
import ast
import sqlite3
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description="Verifica a base SQLite gerada.")
    parser.add_argument("--banco", type=Path, default=Path("output/hackathon_cempro.sqlite"))
    args = parser.parse_args()

    ast.parse(Path("scripts/importar_sqlite.py").read_text(encoding="utf-8"))
    with sqlite3.connect(args.banco) as con:
        integridade = con.execute("PRAGMA integrity_check").fetchone()[0]
        erros_fk = con.execute("PRAGMA foreign_key_check").fetchall()
        contagens = {
            tabela: con.execute(f"SELECT COUNT(*) FROM {tabela}").fetchone()[0]
            for tabela in ("clientes", "atendimentos", "uso_servicos")
        }
        con.executescript(Path("sql/consultas_demo.sql").read_text(encoding="utf-8"))
        exemplo_acento = con.execute(
            "SELECT assunto FROM atendimentos WHERE assunto LIKE 'Dúvida%' LIMIT 1"
        ).fetchone()[0]

    assert integridade == "ok", integridade
    assert not erros_fk, erros_fk
    assert contagens == {"clientes": 100, "atendimentos": 300, "uso_servicos": 300}, contagens
    assert exemplo_acento == "Dúvida de utilização", exemplo_acento
    print(f"OK: integridade, chaves, consultas, acentos e contagens {contagens}")


if __name__ == "__main__":
    main()
