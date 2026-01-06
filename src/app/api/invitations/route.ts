import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getUserInvitations } from "@/lib/services/groups.service";
import { ApiError } from "@/lib/errors/api-error";

/**
 * GET /api/invitations - Get pending invitations for current user
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const invitations = await getUserInvitations(session.user.id);
    return NextResponse.json(invitations);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
