import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { changeMemberRole, removeMember } from "@/lib/services/groups.service";
import { changeMemberRoleSchema } from "@/lib/validations/groups.schema";
import { ApiError } from "@/lib/errors/api-error";

interface RouteParams {
  params: Promise<{ groupId: string; memberId: string }>;
}

/**
 * PATCH /api/groups/[groupId]/members/[memberId] - Change member role
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { groupId, memberId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { role } = changeMemberRoleSchema.parse(body);

    await changeMemberRole(groupId, session.user.id, memberId, role);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error changing member role:", error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * DELETE /api/groups/[groupId]/members/[memberId] - Remove a member
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { groupId, memberId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await removeMember(groupId, session.user.id, memberId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
