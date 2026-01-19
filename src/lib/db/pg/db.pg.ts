import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Lazy initialization of database connection
// This prevents errors during build/static generation when POSTGRES_URL might not be available
let pool: Pool | null = null;
let pgDbInstance: NodePgDatabase | null = null;

function getDb(): NodePgDatabase {
  if (!pgDbInstance) {
    const connectionString = process.env.POSTGRES_URL;
    if (!connectionString) {
      // During build time or when DB is not configured, throw a more descriptive error
      // This allows the build to continue for pages that don't need the database
      throw new Error(
        "Database connection not available. POSTGRES_URL environment variable is required.",
      );
    }
    pool = new Pool({
      connectionString,
    });
    pgDbInstance = drizzle(pool);
  }
  return pgDbInstance;
}

// Export pgDb - will initialize on first access
// This allows modules to import it without immediately connecting
// Using Proxy to ensure proper method binding
export const pgDb = new Proxy({} as NodePgDatabase, {
  get(_target, prop) {
    const db = getDb();
    const value = db[prop as keyof NodePgDatabase];
    // Ensure methods are bound to the correct context
    if (typeof value === "function") {
      return value.bind(db);
    }
    return value;
  },
});
