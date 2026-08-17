export class AppError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status = 400) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}

export class ValidationError extends AppError {
  readonly issues: unknown;

  constructor(message: string, issues?: unknown) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
    this.issues = issues;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export function publicErrorMessage(error: Error): string {
  const message = error.message?.trim() ?? "";
  if (!message || message.startsWith("{clientVersion") || message === "[object Object]") {
    return "Veza sa bazom nije uspjela. Sačekajte par sekundi i pokušajte ponovo.";
  }
  return message;
}
