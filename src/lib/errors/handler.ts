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
 * Context type for dynamic route handlers
 */
export interface RouteContext<T = Record<string, string>> {
  params: Promise<T>;
}

/**
 * Wrapper for API route handlers with automatic error handling
 * Use for routes without dynamic params
 */
export function withErrorHandler(
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse>;

/**
 * Wrapper for API route handlers with automatic error handling
 * Use for routes with dynamic params (e.g., [id] routes)
 */
export function withErrorHandler<T extends Record<string, string>>(
  handler: (req: NextRequest, context: RouteContext<T>) => Promise<NextResponse>
): (req: NextRequest, context: RouteContext<T>) => Promise<NextResponse>;

/**
 * Implementation
 */
export function withErrorHandler<T extends Record<string, string>>(
  handler:
    | ((req: NextRequest) => Promise<NextResponse>)
    | ((req: NextRequest, context: RouteContext<T>) => Promise<NextResponse>)
) {
  return async (req: NextRequest, context?: RouteContext<T>): Promise<NextResponse> => {
    try {
      if (context !== undefined) {
        return await (handler as (req: NextRequest, context: RouteContext<T>) => Promise<NextResponse>)(req, context);
      }
      return await (handler as (req: NextRequest) => Promise<NextResponse>)(req);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
