import { PrismaPg } from "@prisma/adapter-pg";
import { setDefaultResultOrder } from "node:dns";
import { PrismaClient } from "../../generated/prisma";
import { runtimeConnectionString, withDbRetry } from "./connection";

setDefaultResultOrder("ipv4first");

function createAdapter(connectionString: string) {
  const serverless = Boolean(process.env.VERCEL);
  return new PrismaPg(
    {
      connectionString: runtimeConnectionString(connectionString),
      max: serverless ? 1 : 3,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: serverless ? 8_000 : 30_000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10_000,
      allowExitOnIdle: true,
    },
    {
      onPoolError: (error) => {
        console.error("pg pool error:", error.message);
      },
      onConnectionError: (error) => {
        console.error("pg connection error:", error.message);
      },
    },
  );
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
      async $allOperations({ query, args }) {
        return withDbRetry(() => query(args), process.env.VERCEL ? 2 : 3);
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
