import "server-only";

import Database from "better-sqlite3";
import path from "node:path";

const databasePath =
  process.env.SQLITE_DB_PATH?.trim() ||
  path.join(process.cwd(), "output", "hackathon_cempro.sqlite");

const globalForDatabase = globalThis as typeof globalThis & {
  sqlite?: Database.Database;
};

export function getDatabase() {
  if (!globalForDatabase.sqlite) {
    globalForDatabase.sqlite = new Database(databasePath, {
      readonly: true,
      fileMustExist: true,
    });
    globalForDatabase.sqlite.pragma("foreign_keys = ON");
  }

  return globalForDatabase.sqlite;
}
