import { Pool, types } from "pg";
import { env } from "../config/env";

// return DATE columns as plain "YYYY-MM-DD" text, not timezone-shifted JS dates
types.setTypeParser(1082, (value: string) => value);

const url = new URL(env.databaseUrl);
url.search = "";

export const demoPool = new Pool({ connectionString: url.toString(), max: 3 });