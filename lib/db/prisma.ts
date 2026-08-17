import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma";

function createAdapter(connectionString: string) {
  const serverless = Boolean(process.env.VERCEL);
  return new PrismaPg({
    connectionString: connectionString.replaceAll("sslmode=require", "sslmode=verify-full"),
    max: serverless ? 4 : 10,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 15_000,
  });
}

function toPlainError(error: unknown): Error {
  if (error instanceof Error) {
    const code = "code" in error && typeof error.code === "string" ? error.code : undefined;
    const message = [code, error.message].filter(Boolean).join(": ") || "Database error";
    const wrapped = new Error(message);
    wrapped.name = error.name || "PrismaError";
    wrapped.cause = error;
    return wrapped;
  }

  return new Error(String(error));
}

export function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = new PrismaClient({
    adapter: createAdapter(connectionString),
  });

  return client.$extends({
    query: {
      async $allOperations({ args, query }) {
        try {
          return await query(args);
        } catch (error) {
          throw toPlainError(error);
        }
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
