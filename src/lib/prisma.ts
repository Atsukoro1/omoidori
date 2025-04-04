import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

declare global {
  // biome-ignore lint/suspicious/noRedeclare: For Bun's hot reloading
  var prisma: PrismaClient | undefined
}

export const db = globalThis.prisma || prisma

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db
}
