/**
 * Applies a SQL migration file to the Supabase Postgres database using
 * Bun's native SQL client. Run with:
 *
 *   bun scripts/apply-migration.ts supabase/migrations/<file>.sql
 *
 * Requires SUPABASE_DB_URL in .env - the Postgres connection string from
 * the Supabase dashboard (Project Settings -> Database -> Connection string,
 * "URI" / session pooler). Bun auto-loads .env into process.env.
 */
import { SQL } from "bun";
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: bun scripts/apply-migration.ts <path-to.sql>");
  process.exit(1);
}

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error(
    "Missing SUPABASE_DB_URL. Add the Postgres connection string from the\n" +
      "Supabase dashboard (Project Settings -> Database -> Connection string -> URI) to .env",
  );
  process.exit(1);
}

const sqlText = readFileSync(file, "utf8");
const db = new SQL(dbUrl);

try {
  console.log(`Applying ${file} ...`);
  await db.unsafe(sqlText);
  console.log("✓ Migration applied successfully.");
} catch (err) {
  console.error("✗ Migration failed:", (err as Error).message);
  process.exitCode = 1;
} finally {
  await db.end();
}
