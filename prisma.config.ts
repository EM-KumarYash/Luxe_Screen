import "./prisma/load-env";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Read lazily rather than with env(): `prisma generate` (run on npm install)
    // must work on a fresh clone before .env.local exists. Commands that talk to
    // the database (migrate, seed, studio) still report a missing DATABASE_URL.
    url: process.env.DATABASE_URL,
  },
});
