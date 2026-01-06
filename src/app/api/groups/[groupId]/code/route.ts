import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { regenerateInviteCode } from "@/lib/services/groups.service";
import { ApiError } from "@/lib/errors/api-error";

interface RouteParams {
  params: Promise<{ groupId: string }>;
}

/**
 * POST /api/groups/[groupId]/code - Regenerate invite code
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const newCode = await regenerateInviteCode(groupId, session.user.id);
    return NextResponse.json({ code: newCode });
  } catch (error) {
    console.error("Error regenerating code:", error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
