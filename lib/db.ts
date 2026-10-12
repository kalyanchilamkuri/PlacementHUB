import { PrismaClient } from '@prisma/client';

// Dev hot-reload re-evaluates modules, which would open a new pool each time.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
