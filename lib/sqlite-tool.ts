import "server-only";

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getDatabase } from "@/lib/db";

const MAX_ROWS = 100;
const MAX_SQL_LENGTH = 10_000;

export const consultarBancoInputSchema = z.object({
  sql: z
    .string()
    .trim()
    .min(1, "Informe uma consulta SQL.")
    .max(MAX_SQL_LENGTH, "A consulta SQL excede o tamanho máximo permitido."),
});

function removeLeadingComments(sql: string) {
  let query = sql.trim();

  while (query.startsWith("--") || query.startsWith("/*")) {
    if (query.startsWith("--")) {
      const endOfLine = query.indexOf("\n");
      query = endOfLine === -1 ? "" : query.slice(endOfLine + 1).trim();
      continue;
    }

    const endOfComment = query.indexOf("*/", 2);
    query = endOfComment === -1 ? "" : query.slice(endOfComment + 2).trim();
  }

  return query;
}

function validateReadOnlyQuery(sql: string) {
  const query = removeLeadingComments(sql);
  const firstKeyword = query.match(/^[a-z]+/i)?.[0].toUpperCase();

  if (firstKeyword !== "SELECT" && firstKeyword !== "WITH") {
    throw new Error("A tool aceita somente consultas SELECT ou WITH.");
  }

  if (query.slice(0, -1).includes(";")) {
    throw new Error("Envie apenas uma consulta SQL por vez.");
  }

  if (
    /\b(INSERT|UPDATE|DELETE|REPLACE|UPSERT|CREATE|ALTER|DROP|ATTACH|DETACH|VACUUM|REINDEX|ANALYZE|PRAGMA)\b/i.test(
      query,
    )
  ) {
    throw new Error("A consulta contém uma operação que não é somente leitura.");
  }

  return query.replace(/;+\s*$/, "");
}

function queryDatabase(sql: string) {
  const query = validateReadOnlyQuery(sql);
  const statement = getDatabase().prepare(query);

  if (!statement.reader) {
    throw new Error("A consulta não produz resultados e não foi executada.");
  }

  const rows: unknown[] = [];
  let truncated = false;

  for (const row of statement.iterate()) {
    if (rows.length === MAX_ROWS) {
      truncated = true;
      break;
    }

    rows.push(row);
  }

  return {
    columns: statement.columns().map((column) => column.name),
    rows,
    truncated,
  };
}

export const consultarBanco = tool(
  async ({ sql }) => JSON.stringify(queryDatabase(sql)),
  {
    name: "consultar_banco",
    description:
      "Executa uma consulta SQL somente leitura no banco SQLite local. Use SELECT ou WITH para consultar tabelas e views. Nunca use SQL para inventar números. O resultado é limitado a 100 linhas.",
    schema: consultarBancoInputSchema,
  },
);
