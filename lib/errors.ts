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
  if (
    /minified React error|#441|react\.dev\/errors\/441|Server Components render/i.test(message)
  ) {
    return "Čuvanje nije uspjelo. Ako dodajete fotografiju, koristite JPEG, PNG, WebP ili GIF do 4 MB.";
  }
  if (
    !message ||
    message.startsWith("{clientVersion") ||
    message === "[object Object]" ||
    /ETIMEDOUT|ECONNRESET|ECONNREFUSED|Connection terminated|Can't reach database|timeout exceeded/i.test(
      message,
    )
  ) {
    return "Veza sa bazom nije uspjela. Sačekajte par sekundi i pokušajte ponovo.";
  }
  return message;
}

export function actionFailureMessage(error: unknown, fallback: string): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error && error.name === "ValidationError" && error.message.trim()) {
    return error.message;
  }
  return fallback;
}
