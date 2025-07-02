import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { boardRoutes } from '../routes/boards';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db'
    }
  }
});

describe('Board API', () => {
  let app: any;

  beforeEach(async () => {
    // Set up fresh Fastify instance for each test
    app = Fastify({ logger: false });
    
    // Register plugins (same as main app)
    await app.register(import('@fastify/sensible'));
    await app.register(import('@fastify/helmet'));
    
    // Register board routes with test database
    await app.register(boardRoutes, { prisma });
    
    // Clean database for each test
    await prisma.card.deleteMany();
    await prisma.column.deleteMany();
    await prisma.board.deleteMany();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/boards', () => {
    it('should create a new board with default title and columns', async () => {
      // Arrange & Act
      const response = await app.inject({
        method: 'POST',
        url: '/api/boards',
        payload: {}
      });

      // Assert
      expect(response.statusCode).toBe(201);
      
      const body = JSON.parse(response.body);
      expect(body.data).toHaveProperty('id');
      expect(body.data.id).toMatch(/^[A-Za-z0-9_-]{21}$/); // nanoid format
      expect(body.data.title).toBe('My Kanban Board');
    });

    it('should create a board with custom title', async () => {
      // Arrange
      const customTitle = 'Project Alpha Board';

      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/api/boards',
        payload: { title: customTitle }
      });

      // Assert
      expect(response.statusCode).toBe(201);
      
      const body = JSON.parse(response.body);
      expect(body.data.title).toBe(customTitle);
    });

    it('should create board with default columns (Todo, In Progress, Done)', async () => {
      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/api/boards',
        payload: {}
      });

      // Assert
      expect(response.statusCode).toBe(201);
      
      const body = JSON.parse(response.body);
      const boardId = body.data.id;

      // Fetch the full board to check columns
      const boardResponse = await app.inject({
        method: 'GET',
        url: `/api/boards/${boardId}`
      });

      const board = JSON.parse(boardResponse.body);
      expect(board.data.columns).toHaveLength(3);
      expect(board.data.columns[0].title).toBe('Todo');
      expect(board.data.columns[1].title).toBe('In Progress');
      expect(board.data.columns[2].title).toBe('Done');
      
      // Check column order
      expect(board.data.columns[0].order).toBe(0);
      expect(board.data.columns[1].order).toBe(1);
      expect(board.data.columns[2].order).toBe(2);
    });

    it('should reject invalid payload', async () => {
      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/api/boards',
        payload: { title: 123 } // Invalid title type
      });

      // Assert
      expect(response.statusCode).toBe(400);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBeDefined();
    });
  });

  describe('GET /api/boards/:id', () => {
    it('should return board with all columns and cards', async () => {
      // Arrange - Create a board first
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/boards',
        payload: { title: 'Test Board' }
      });
      const boardId = JSON.parse(createResponse.body).data.id;

      // Act
      const response = await app.inject({
        method: 'GET',
        url: `/api/boards/${boardId}`
      });

      // Assert
      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.data).toHaveProperty('id', boardId);
      expect(body.data).toHaveProperty('title', 'Test Board');
      expect(body.data).toHaveProperty('createdAt');
      expect(body.data).toHaveProperty('columns');
      expect(Array.isArray(body.data.columns)).toBe(true);
    });

    it('should return 404 for non-existent board', async () => {
      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/api/boards/non-existent-id'
      });

      // Assert
      expect(response.statusCode).toBe(404);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Board not found');
    });

    it('should include nested cards in correct order', async () => {
      // This test will drive the implementation of proper data fetching
      // Arrange - Create board and add some cards (this will be implemented later)
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/boards',
        payload: {}
      });
      const boardId = JSON.parse(createResponse.body).data.id;

      // Act
      const response = await app.inject({
        method: 'GET',
        url: `/api/boards/${boardId}`
      });

      // Assert
      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      body.data.columns.forEach((column: any) => {
        expect(column).toHaveProperty('cards');
        expect(Array.isArray(column.cards)).toBe(true);
      });
    });
  });

  describe('PUT /api/boards/:id', () => {
    it('should update board state completely', async () => {
      // Arrange - Create a board first
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/boards',
        payload: {}
      });
      const boardId = JSON.parse(createResponse.body).data.id;

      const updatedBoard = {
        title: 'Updated Board Title',
        columns: [
          {
            id: 'col-1',
            title: 'Updated Todo',
            order: 0,
            cards: [
              { id: 'card-1', content: 'First task', order: 0 },
              { id: 'card-2', content: 'Second task', order: 1 }
            ]
          }
        ]
      };

      // Act
      const response = await app.inject({
        method: 'PUT',
        url: `/api/boards/${boardId}`,
        payload: updatedBoard
      });

      // Assert
      expect(response.statusCode).toBe(204);

      // Verify the update by fetching the board
      const fetchResponse = await app.inject({
        method: 'GET',
        url: `/api/boards/${boardId}`
      });

      const body = JSON.parse(fetchResponse.body);
      expect(body.data.title).toBe('Updated Board Title');
      expect(body.data.columns).toHaveLength(1);
      expect(body.data.columns[0].title).toBe('Updated Todo');
      expect(body.data.columns[0].cards).toHaveLength(2);
    });

    it('should return 404 for non-existent board', async () => {
      // Act
      const response = await app.inject({
        method: 'PUT',
        url: '/api/boards/non-existent-id',
        payload: { title: 'Test' }
      });

      // Assert
      expect(response.statusCode).toBe(404);
    });

    it('should validate board structure', async () => {
      // Arrange
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/boards',
        payload: {}
      });
      const boardId = JSON.parse(createResponse.body).data.id;

      // Act - Send invalid structure
      const response = await app.inject({
        method: 'PUT',
        url: `/api/boards/${boardId}`,
        payload: { invalidField: 'test' }
      });

      // Assert
      expect(response.statusCode).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should limit board creation requests', async () => {
      // This test drives implementation of rate limiting
      const requests = [];
      
      // Make multiple requests quickly
      for (let i = 0; i < 102; i++) { // Exceed the limit of 100/minute
        requests.push(
          app.inject({
            method: 'POST',
            url: '/api/boards',
            payload: {}
          })
        );
      }

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.statusCode === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
}); 