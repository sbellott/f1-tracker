import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/utils';
import { registerSchema } from '@/lib/validations/auth.schema';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/utils/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      // Format Zod errors to Record<string, string[]>
      const formattedErrors: Record<string, string[]> = {};
      for (const error of validated.error.errors) {
        const path = error.path.join('.') || 'general';
        if (!formattedErrors[path]) {
          formattedErrors[path] = [];
        }
        formattedErrors[path].push(error.message);
      }
      return validationErrorResponse(formattedErrors);
    }

    const { email, password, pseudo } = validated.data;
    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return errorResponse('An account with this email already exists', 409);
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        pseudo,
      },
      select: {
        id: true,
        email: true,
        pseudo: true,
        createdAt: true,
      },
    });

    return successResponse(user, 201);
  } catch (error) {
    console.error('Registration error:', error);
    // Include more details in production for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(`Registration error: ${errorMessage}`);
  }
}