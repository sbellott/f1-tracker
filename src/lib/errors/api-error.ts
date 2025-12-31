export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "BAD_REQUEST"
  | "PREDICTION_LOCKED"
  | "GROUP_FULL"
  | "ALREADY_MEMBER"
  | "EXTERNAL_API_ERROR";

export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    code: ApiErrorCode,
    message: string,
    statusCode: number = 500,
    details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError("BAD_REQUEST", message, 400, details);
  }

  static validation(message: string, details?: unknown): ApiError {
    return new ApiError("VALIDATION_ERROR", message, 400, details);
  }

  static unauthorized(message: string = "Non authentifié"): ApiError {
    return new ApiError("UNAUTHORIZED", message, 401);
  }

  static forbidden(message: string = "Accès refusé"): ApiError {
    return new ApiError("FORBIDDEN", message, 403);
  }

  static notFound(resource: string = "Ressource"): ApiError {
    return new ApiError("NOT_FOUND", `${resource} non trouvé(e)`, 404);
  }

  static conflict(message: string, details?: unknown): ApiError {
    return new ApiError("CONFLICT", message, 409, details);
  }

  static rateLimited(message: string = "Trop de requêtes"): ApiError {
    return new ApiError("RATE_LIMITED", message, 429);
  }

  static internal(message: string = "Erreur interne du serveur"): ApiError {
    return new ApiError("INTERNAL_ERROR", message, 500);
  }

  static predictionLocked(): ApiError {
    return new ApiError(
      "PREDICTION_LOCKED",
      "Les pronostics sont verrouillés pour cette course",
      400
    );
  }

  static alreadyMember(): ApiError {
    return new ApiError("ALREADY_MEMBER", "Vous êtes déjà membre de ce groupe", 409);
  }

  static externalApi(service: string, message: string): ApiError {
    return new ApiError(
      "EXTERNAL_API_ERROR",
      `Erreur API ${service}: ${message}`,
      502
    );
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }
}
