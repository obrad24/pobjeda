import EmbeddedPostgres from "embedded-postgres";
import { mkdir } from "node:fs/promises";
import path from "node:path";

async function main() {
  const port = Number(process.env.LOCAL_PG_PORT ?? "54329");
  const databaseDir = path.resolve(process.cwd(), ".local-pg");

  await mkdir(databaseDir, { recursive: true });

  const pg = new EmbeddedPostgres({
    databaseDir,
    port,
    user: "pobjeda",
    password: "pobjeda",
    persistent: true,
    onLog: (message) => process.stdout.write(String(message)),
    onError: (message) => console.error(message),
  });

  await pg.initialise();
  await pg.start();

  try {
    await pg.createDatabase("pobjeda");
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error);
    if (!/already exists/i.test(text)) {
      console.warn(text);
    }
  }

  console.log(`LOCAL_PG_READY postgresql://pobjeda:pobjeda@127.0.0.1:${port}/pobjeda`);

  await new Promise(() => {
    /* keep the cluster running until the process is stopped */
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
