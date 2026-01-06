import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { joinGroupByCode } from "@/lib/services/groups.service";
import { joinGroupByCodeSchema } from "@/lib/validations/groups.schema";
import { ApiError } from "@/lib/errors/api-error";

/**
 * POST /api/groups/join - Join a group with invite code
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { code } = joinGroupByCodeSchema.parse(body);

    const group = await joinGroupByCode(session.user.id, code);
    return NextResponse.json(group);
  } catch (error) {
    console.error("Error joining group:", error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Code invalide" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
