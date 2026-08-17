import { revalidatePath } from "next/cache";
import { authorizeCronRequest } from "@/lib/auth/cron";
import { CACHE_TAGS, revalidatePublic } from "@/lib/query-cache";
import { syncSportDCLeague } from "@/lib/sportdc/sync";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return Response.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 },
    );
  }

  if (!authorizeCronRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncSportDCLeague();
    revalidatePath("/");
    revalidatePath("/liga");
    revalidatePath("/rezultati");
    revalidatePublic(CACHE_TAGS.league);
    return Response.json(result, { status: result.ok ? 200 : 502 });
  } catch (error) {
    if ((error as { code?: string }).code === "SYNC_IN_PROGRESS") {
      return Response.json({ error: "Sync already running" }, { status: 409 });
    }
    throw error;
  }
}
