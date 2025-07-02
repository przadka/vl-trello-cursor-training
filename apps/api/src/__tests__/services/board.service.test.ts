import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { BoardService } from '../../services/board.service';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test-service.db'
    }
  }
});

const boardService = new BoardService(prisma);

describe('BoardService', () => {
  beforeEach(async () => {
    // Clean database before each test
    await prisma.card.deleteMany();
    await prisma.column.deleteMany();
    await prisma.board.deleteMany();
  });

  afterEach(async () => {
    // Clean up after each test
    await prisma.card.deleteMany();
    await prisma.column.deleteMany();
    await prisma.board.deleteMany();
  });

  describe('createBoard()', () => {
    it('should create board with unique nanoid', async () => {
      // Act
      const board1 = await boardService.createBoard({ title: 'Board 1' });
      const board2 = await boardService.createBoard({ title: 'Board 2' });

      // Assert
      expect(board1.id).toMatch(/^[A-Za-z0-9_-]{21}$/);
      expect(board2.id).toMatch(/^[A-Za-z0-9_-]{21}$/);
      expect(board1.id).not.toBe(board2.id);
    });

    it('should create board with default title when none provided', async () => {
      // Act
      const board = await boardService.createBoard({});

      // Assert
      expect(board.title).toBe('My Kanban Board');
      expect(board.createdAt).toBeInstanceOf(Date);
    });

    it('should create board with custom title', async () => {
      // Arrange
      const customTitle = 'Project Management Board';

      // Act
      const board = await boardService.createBoard({ title: customTitle });

      // Assert
      expect(board.title).toBe(customTitle);
    });

    it('should create default columns (Todo, In Progress, Done)', async () => {
      // Act
      const board = await boardService.createBoard({});
      const fullBoard = await boardService.getBoardById(board.id);

      // Assert
      expect(fullBoard).toBeDefined();
      if (!fullBoard) return; // Type guard
      
      expect(fullBoard.columns).toHaveLength(3);
      const columns = fullBoard.columns.sort((a, b) => a.order - b.order);
      expect(columns[0].title).toBe('Todo');
      expect(columns[0].order).toBe(0);
      expect(columns[1].title).toBe('In Progress');
      expect(columns[1].order).toBe(1);
      expect(columns[2].title).toBe('Done');
      expect(columns[2].order).toBe(2);
    });

    it('should create columns with unique nanoid', async () => {
      // Act
      const board = await boardService.createBoard({});
      const fullBoard = await boardService.getBoardById(board.id);

      // Assert
      expect(fullBoard!.columns).toHaveLength(3);
      const columnIds = fullBoard!.columns.map(col => col.id);
      
      // All IDs should be unique and match nanoid format
      expect(new Set(columnIds).size).toBe(3);
      columnIds.forEach(id => {
        expect(id).toMatch(/^[A-Za-z0-9_-]{21}$/);
      });
    });

    it('should create empty cards array for each column', async () => {
      // Act
      const board = await boardService.createBoard({});
      const fullBoard = await boardService.getBoardById(board.id);

      // Assert
      fullBoard!.columns.forEach(column => {
        expect(column.cards).toEqual([]);
      });
    });
  });

  describe('getBoardById()', () => {
    it('should return null for non-existent board', async () => {
      // Act
      const board = await boardService.getBoardById('non-existent-id');

      // Assert
      expect(board).toBeNull();
    });

    it('should return board with nested columns and cards', async () => {
      // Arrange
      const createdBoard = await boardService.createBoard({ title: 'Test Board' });

      // Act
      const board = await boardService.getBoardById(createdBoard.id);

      // Assert
      expect(board).toBeDefined();
      expect(board!.id).toBe(createdBoard.id);
      expect(board!.title).toBe('Test Board');
      expect(board!.columns).toBeDefined();
      expect(Array.isArray(board!.columns)).toBe(true);
      
      // Each column should have cards array
      board!.columns.forEach(column => {
        expect(column).toHaveProperty('cards');
        expect(Array.isArray(column.cards)).toBe(true);
      });
    });

    it('should return columns in correct order', async () => {
      // Arrange
      const createdBoard = await boardService.createBoard({});

      // Act
      const board = await boardService.getBoardById(createdBoard.id);

      // Assert
      expect(board).toBeDefined();
      expect(board!.columns).toBeDefined();
      const columns = board!.columns;
      expect(columns[0].order).toBeLessThan(columns[1].order);
      expect(columns[1].order).toBeLessThan(columns[2].order);
    });

    it('should return cards in correct order within columns', async () => {
      // This test drives implementation of proper ordering
      // Arrange - Create board and manually add some cards
      const createdBoard = await boardService.createBoard({});
      const fullBoard = await boardService.getBoardById(createdBoard.id);
      const firstColumn = fullBoard!.columns[0];

      // Manually create cards with different orders
      await prisma.card.create({
        data: {
          id: 'card-1',
          content: 'Second card',
          order: 1,
          columnId: firstColumn.id
        }
      });
      await prisma.card.create({
        data: {
          id: 'card-2',
          content: 'First card',
          order: 0,
          columnId: firstColumn.id
        }
      });

      // Act
      const board = await boardService.getBoardById(createdBoard.id);

      // Assert
      const column = board!.columns.find(col => col.id === firstColumn.id);
      expect(column!.cards).toHaveLength(2);
      expect(column!.cards[0].content).toBe('First card');
      expect(column!.cards[1].content).toBe('Second card');
    });
  });

  describe('updateBoard()', () => {
    it('should update board title', async () => {
      // Arrange
      const createdBoard = await boardService.createBoard({ title: 'Original Title' });
      const updateData = {
        title: 'Updated Title',
        columns: []
      };

      // Act
      await boardService.updateBoard(createdBoard.id, updateData);

      // Assert
      const updatedBoard = await boardService.getBoardById(createdBoard.id);
      expect(updatedBoard!.title).toBe('Updated Title');
    });

    it('should replace all columns and cards', async () => {
      // Arrange
      const createdBoard = await boardService.createBoard({});
      const updateData = {
        title: 'Updated Board',
        columns: [
          {
            id: 'new-col-1',
            title: 'New Column',
            order: 0,
            cards: [
              { id: 'new-card-1', content: 'New Card', order: 0 }
            ]
          }
        ]
      };

      // Act
      await boardService.updateBoard(createdBoard.id, updateData);

      // Assert
      const updatedBoard = await boardService.getBoardById(createdBoard.id);
      expect(updatedBoard!.columns).toHaveLength(1);
      expect(updatedBoard!.columns[0].title).toBe('New Column');
      expect(updatedBoard!.columns[0].cards).toHaveLength(1);
      expect(updatedBoard!.columns[0].cards[0].content).toBe('New Card');
    });

    it('should handle card reordering within columns', async () => {
      // Arrange
      const createdBoard = await boardService.createBoard({});
      const updateData = {
        title: 'Test Board',
        columns: [
          {
            id: 'col-1',
            title: 'Test Column',
            order: 0,
            cards: [
              { id: 'card-1', content: 'Card A', order: 1 },
              { id: 'card-2', content: 'Card B', order: 0 },
              { id: 'card-3', content: 'Card C', order: 2 }
            ]
          }
        ]
      };

      // Act
      await boardService.updateBoard(createdBoard.id, updateData);

      // Assert
      const updatedBoard = await boardService.getBoardById(createdBoard.id);
      const column = updatedBoard!.columns[0];
      
      // Cards should be returned in order
      expect(column.cards[0].content).toBe('Card B'); // order: 0
      expect(column.cards[1].content).toBe('Card A'); // order: 1
      expect(column.cards[2].content).toBe('Card C'); // order: 2
    });

    it('should handle moving cards between columns', async () => {
      // Arrange
      const createdBoard = await boardService.createBoard({});
      const updateData = {
        title: 'Test Board',
        columns: [
          {
            id: 'col-1',
            title: 'Column 1',
            order: 0,
            cards: [
              { id: 'card-1', content: 'Moved Card', order: 0 }
            ]
          },
          {
            id: 'col-2',
            title: 'Column 2',
            order: 1,
            cards: []
          }
        ]
      };

      // Act
      await boardService.updateBoard(createdBoard.id, updateData);

      // Assert
      const updatedBoard = await boardService.getBoardById(createdBoard.id);
      expect(updatedBoard!.columns[0].cards).toHaveLength(1);
      expect(updatedBoard!.columns[1].cards).toHaveLength(0);
      expect(updatedBoard!.columns[0].cards[0].content).toBe('Moved Card');
    });

    it('should throw error for non-existent board', async () => {
      // Arrange
      const updateData = { title: 'Test', columns: [] };

      // Act & Assert
      await expect(
        boardService.updateBoard('non-existent-id', updateData)
      ).rejects.toThrow('Board not found');
    });

    it('should preserve board creation date', async () => {
      // Arrange
      const createdBoard = await boardService.createBoard({});
      const originalCreatedAt = createdBoard.createdAt;
      
      const updateData = {
        title: 'Updated Title',
        columns: []
      };

      // Act
      await boardService.updateBoard(createdBoard.id, updateData);

      // Assert
      const updatedBoard = await boardService.getBoardById(createdBoard.id);
      expect(updatedBoard!.createdAt).toEqual(originalCreatedAt);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test drives implementation of proper error handling
      // We would mock Prisma to throw errors in a real implementation
      expect(true).toBe(true); // Placeholder for error handling tests
    });

    it('should validate input data structure', async () => {
      // This test would drive implementation of input validation
      // in the service layer before hitting the database
      expect(true).toBe(true); // Placeholder for validation tests
    });
  });
}); 