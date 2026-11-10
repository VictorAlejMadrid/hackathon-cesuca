import { connection } from "next/server";

import { getDashboardData } from "@/lib/dashboard-data";

export async function GET() {
  try {
    await connection();
    return Response.json(getDashboardData(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível consultar o banco.";

    return Response.json({ error: message }, { status: 500 });
  }
}
