import { PrismaClient } from '@prisma/client';

declare global {
  // Prevent multiple instances of Prisma Client in development (hot reload)
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Construct DATABASE_URL from individual DB_* environment variables if not provided
const databaseUrl = process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const prisma =
  global.__prisma ??
  new PrismaClient({
    datasourceUrl: databaseUrl,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export { prisma };
