import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use appropriate database client based on environment
async function initializeDatabase() {
  if (process.env.NODE_ENV === 'production') {
    // Production: Use postgres-js for Docker PostgreSQL
    console.log('Initializing production PostgreSQL client for Docker...');
    const { drizzle } = await import('drizzle-orm/postgres-js');
    const postgres = (await import('postgres')).default;
    const client = postgres(process.env.DATABASE_URL);
    return drizzle(client, { schema });
  } else {
    // Development: Use Neon serverless client
    console.log('Initializing development Neon client...');
    const { Pool, neonConfig } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-serverless');
    const ws = await import("ws");
    
    neonConfig.webSocketConstructor = ws.default;
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    return drizzle({ client: pool, schema });
  }
}

export const db = await initializeDatabase();