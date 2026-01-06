import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { respondToInvitation } from "@/lib/services/groups.service";
import { respondToInvitationSchema } from "@/lib/validations/groups.schema";
import { ApiError } from "@/lib/errors/api-error";

interface RouteParams {
  params: Promise<{ invitationId: string }>;
}

/**
 * POST /api/invitations/[invitationId] - Respond to an invitation
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { invitationId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { accept } = respondToInvitationSchema.parse(body);

    const group = await respondToInvitation(invitationId, session.user.id, accept);
    
    if (accept && group) {
      return NextResponse.json({ accepted: true, group });
    }
    
    return NextResponse.json({ accepted: false });
  } catch (error) {
    console.error("Error responding to invitation:", error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
