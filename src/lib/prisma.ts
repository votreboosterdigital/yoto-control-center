import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'node:path'

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL ?? 'file:./dev.db'
  // Extraire le chemin depuis "file:./dev.db" ou "file:/abs/path/dev.db"
  const dbPath = dbUrl.replace(/^file:/, '')
  const resolvedPath = path.isAbsolute(dbPath)
    ? dbPath
    : path.join(/*turbopackIgnore: true*/ process.cwd(), dbPath)

  const adapter = new PrismaBetterSqlite3({ url: resolvedPath })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
