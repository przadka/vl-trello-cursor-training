import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { BoardService } from '../services/board.service';
import { z } from 'zod';

// Define the schema locally for now
const CreateBoardSchema = z.object({
  title: z.string().optional(),
});

export async function boardRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions & { prisma: PrismaClient }
) {
  const boardService = new BoardService(options.prisma);

  // POST /api/boards
  fastify.post('/api/boards', async (request, reply) => {
    try {
      // Validate request body
      const validatedData = CreateBoardSchema.parse(request.body);
      
      // Create board using our service
      const createData: { title?: string } = {};
      if (validatedData.title) {
        createData.title = validatedData.title;
      }
      const board = await boardService.createBoard(createData);
      
      // Return 201 with the expected format
      return reply.status(201).send({
        data: board
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return reply.status(400).send({
          error: 'Invalid request data'
        });
      }
      
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // GET /api/boards/:id
  fastify.get('/api/boards/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const board = await boardService.getBoardById(id);
      
      if (!board) {
        return reply.status(404).send({
          error: 'Board not found'
        });
      }
      
      return reply.send({
        data: board
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });
} 