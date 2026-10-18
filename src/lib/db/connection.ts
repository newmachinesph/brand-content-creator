import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const DATABASE_URL = import.meta.env.VITE_DATABASE_URL as string;

export function getDb() {
  if (!DATABASE_URL) {
    throw new Error("VITE_DATABASE_URL is not set");
  }
  const sql = neon(DATABASE_URL);
  return drizzle(sql);
}
