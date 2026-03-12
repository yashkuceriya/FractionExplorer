import { getSessionStats } from "@/lib/ai/langsmith";

export async function GET() {
  return Response.json(getSessionStats());
}
