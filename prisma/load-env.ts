// Loads env vars for Prisma CLI commands (migrate, seed, studio) with the same
// precedence as Next.js: .env.local wins over .env. Missing files are ignored.
import { config } from "dotenv";

config({ path: [".env.local", ".env"], quiet: true });
