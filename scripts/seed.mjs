import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const dbPath = path.resolve(process.cwd(), process.env.DATABASE_PATH || "data/chelsi.sqlite");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
new DatabaseSync(dbPath).close();
console.log(`Database ready at ${dbPath}. It will be fully migrated and seeded on first app request.`);
