import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// For Docker/regular PostgreSQL - use postgres-js client
console.log('Using production PostgreSQL database client for Docker');
const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client, { schema });