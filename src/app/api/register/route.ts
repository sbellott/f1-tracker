import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { registerSchema } from "@/lib/validations/auth.schema";
import { hashPassword } from "@/lib/auth/utils";
import { handleApiError } from "@/lib/errors/handler";
import { ApiError } from "@/lib/errors/api-error";
import { apiCreated } from "@/lib/utils/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, pseudo } = registerSchema.parse(body);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw ApiError.conflict("Cette adresse email est déjà utilisée");
    }

    // Check if pseudo already exists
    const existingPseudo = await prisma.user.findFirst({
      where: { pseudo },
      select: { id: true },
    });

    if (existingPseudo) {
      throw ApiError.conflict("Ce pseudo est déjà utilisé");
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        pseudo,
      },
      select: {
        id: true,
        email: true,
        pseudo: true,
        avatar: true,
        createdAt: true,
      },
    });

    return apiCreated({
      id: user.id,
      email: user.email,
      pseudo: user.pseudo,
      avatar: user.avatar,
      createdAt: user.createdAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
