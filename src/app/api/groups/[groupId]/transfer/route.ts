import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { transferOwnership } from "@/lib/services/groups.service";
import { transferOwnershipSchema } from "@/lib/validations/groups.schema";
import { ApiError } from "@/lib/errors/api-error";

interface RouteParams {
  params: Promise<{ groupId: string }>;
}

/**
 * POST /api/groups/[groupId]/transfer - Transfer ownership
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { newOwnerId } = transferOwnershipSchema.parse(body);

    await transferOwnership(groupId, session.user.id, newOwnerId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error transferring ownership:", error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
