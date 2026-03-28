import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type DbClient = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Returns a Drizzle client bound to the Neon connection.
 * Called lazily at runtime so Next.js can build without DATABASE_URL set.
 * In Neon's HTTP/serverless driver each call is stateless — a new client
 * per request is correct and expected.
 */
export function getDb(): DbClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Please add it to your .env.local file."
    );
  }
  return drizzle(neon(databaseUrl), { schema });
}
