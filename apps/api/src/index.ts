import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { boardRoutes } from './routes/boards';

const fastify = Fastify({
  logger: {
    level: process.env['NODE_ENV'] === 'production' ? 'info' : 'debug',
  },
});

// Initialize database
const prisma = new PrismaClient();

// Register plugins
await fastify.register(import('@fastify/sensible'));
await fastify.register(import('@fastify/helmet'));
await fastify.register(import('@fastify/rate-limit'), {
  max: 100,
  timeWindow: '1 minute',
});

// Health check route
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register board routes
await fastify.register(boardRoutes, { prisma });

// Start server
const start = async () => {
  try {
    const port = Number(process.env['PORT']) || 3000;
    const host = process.env['API_HOST'] || 'localhost';
    
    await fastify.listen({ port, host });
    console.log(`🚀 API server running at http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

start(); 