import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getGroup, updateGroup, deleteGroup } from "@/lib/services/groups.service";
import { updateGroupSchema } from "@/lib/validations/groups.schema";
import { ApiError } from "@/lib/errors/api-error";

interface RouteParams {
  params: Promise<{ groupId: string }>;
}

/**
 * GET /api/groups/[groupId] - Get a specific group
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    const session = await auth();

    const group = await getGroup(groupId, session?.user?.id);
    
    if (!group) {
      return NextResponse.json({ error: "Groupe non trouvé" }, { status: 404 });
    }

    // If private and user is not a member, hide details
    if (group.isPrivate && !group.currentUserRole) {
      return NextResponse.json({ error: "Groupe privé" }, { status: 403 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error("Error fetching group:", error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PATCH /api/groups/[groupId] - Update a group
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateGroupSchema.parse(body);

    const group = await updateGroup(groupId, session.user.id, validatedData);
    return NextResponse.json(group);
  } catch (error) {
    console.error("Error updating group:", error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * DELETE /api/groups/[groupId] - Delete a group
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await deleteGroup(groupId, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting group:", error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
