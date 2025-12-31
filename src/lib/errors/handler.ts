import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "./api-error";

export function handleApiError(error: unknown): NextResponse {
  console.error("[API Error]", error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Données invalides",
          details: formattedErrors,
        },
      },
      { status: 400 }
    );
  }

  // Handle custom API errors
  if (error instanceof ApiError) {
    return NextResponse.json(error.toJSON(), { status: error.statusCode });
  }

  // Handle Prisma errors
  if (isPrismaError(error)) {
    return handlePrismaError(error);
  }

  // Handle generic errors
  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message:
            process.env.NODE_ENV === "development"
              ? error.message
              : "Erreur interne du serveur",
        },
      },
      { status: 500 }
    );
  }

  // Fallback for unknown errors
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Erreur interne du serveur",
      },
    },
    { status: 500 }
  );
}

interface PrismaClientError {
  code: string;
  meta?: { target?: string[] };
}

function isPrismaError(error: unknown): error is PrismaClientError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as PrismaClientError).code === "string" &&
    (error as PrismaClientError).code.startsWith("P")
  );
}

function handlePrismaError(error: PrismaClientError): NextResponse {
  switch (error.code) {
    case "P2002": {
      const field = error.meta?.target?.[0] || "champ";
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: `Ce ${field} existe déjà`,
            details: { field },
          },
        },
        { status: 409 }
      );
    }
    case "P2025":
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Ressource non trouvée",
          },
        },
        { status: 404 }
      );
    case "P2003":
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Référence invalide",
          },
        },
        { status: 400 }
      );
    default:
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Erreur base de données",
          },
        },
        { status: 500 }
      );
  }
}

/**
 * Wrapper for API route handlers with automatic error handling
 */
export function withErrorHandler<T>(
  handler: (req: NextRequest, context?: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: T): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
