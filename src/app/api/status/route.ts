import { connection } from "next/server";
import { activeInfo } from "@/lib/ai/provider";
import type { StatusInfo } from "@/lib/types";

export async function GET() {
  await connection(); // read env at request time, not build time
  const info = activeInfo();
  const body: StatusInfo = { mode: info ? "live" : "demo", model: info?.model ?? null, provider: info?.provider ?? null };
  return Response.json(body);
}
