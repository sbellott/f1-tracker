import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getGroupLeaderboard, getGroup } from "@/lib/services/groups.service";
import { leaderboardQuerySchema } from "@/lib/validations/groups.schema";
import { ApiError } from "@/lib/errors/api-error";

interface RouteParams {
  params: Promise<{ groupId: string }>;
}

/**
 * GET /api/groups/[groupId]/leaderboard - Get group leaderboard
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Check if user is a member
    const group = await getGroup(groupId, session.user.id);
    if (!group) {
      return NextResponse.json({ error: "Groupe non trouvé" }, { status: 404 });
    }
    if (!group.currentUserRole) {
      return NextResponse.json({ error: "Vous n'êtes pas membre de ce groupe" }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const seasonParam = searchParams.get("season");
    const { season } = leaderboardQuerySchema.parse({ 
      season: seasonParam || undefined 
    });

    const leaderboard = await getGroupLeaderboard(groupId, season);
    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
