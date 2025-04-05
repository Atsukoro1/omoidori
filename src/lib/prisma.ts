import { PrismaClient } from '@prisma/client'
import { env } from './env'

const prisma = new PrismaClient()

declare global {
  // biome-ignore lint/suspicious/noRedeclare: For Bun's hot reloading
  var prisma: PrismaClient | undefined
}

export const db = globalThis.prisma || prisma

if (env.NODE_ENV !== 'production') {
  globalThis.prisma = db
}
