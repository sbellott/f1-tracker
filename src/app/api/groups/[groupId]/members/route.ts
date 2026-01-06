import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getGroupLeaderboard, leaveGroup } from "@/lib/services/groups.service";
import { ApiError } from "@/lib/errors/api-error";

interface RouteParams {
  params: Promise<{ groupId: string }>;
}

/**
 * GET /api/groups/[groupId]/members - Get all members of a group
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Use leaderboard which includes member data with points
    const leaderboard = await getGroupLeaderboard(groupId);
    return NextResponse.json(leaderboard.members);
  } catch (error) {
    console.error("Error fetching members:", error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * DELETE /api/groups/[groupId]/members - Leave a group (current user)
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await leaveGroup(groupId, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error leaving group:", error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
