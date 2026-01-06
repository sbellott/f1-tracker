import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { createGroup, getUserGroups } from "@/lib/services/groups.service";
import { createGroupSchema } from "@/lib/validations/groups.schema";
import { ApiError } from "@/lib/errors/api-error";

/**
 * GET /api/groups - Get all groups for the current user
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const groups = await getUserGroups(session.user.id);
    return NextResponse.json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST /api/groups - Create a new group
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createGroupSchema.parse(body);

    const group = await createGroup(session.user.id, validatedData);
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("Error creating group:", error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
