import { beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Declare global test utilities type
declare global {
  // eslint-disable-next-line no-var
  var testUtils: {
    prisma: PrismaClient;
    createTestBoard: (title?: string) => Promise<unknown>;
    createTestCard: (columnId: string, content?: string, order?: number) => Promise<unknown>;
  };
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db'
    }
  }
});

beforeAll(async () => {
  // Run migrations for test database
  // In a real implementation, you would run:
  // await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
  console.log('🧪 Test setup: Database initialized');
});

afterAll(async () => {
  // Clean up after all tests
  await prisma.$disconnect();
  console.log('🧪 Test teardown: Database disconnected');
});

beforeEach(async () => {
  // Clean database before each test
  await prisma.card.deleteMany();
  await prisma.column.deleteMany();
  await prisma.board.deleteMany();
});

// Global test utilities
global.testUtils = {
  prisma,
  
  // Helper to create a test board
  async createTestBoard(title = 'Test Board') {
    return prisma.board.create({
      data: {
        title,
        columns: {
          create: [
            { title: 'Todo', order: 0 },
            { title: 'In Progress', order: 1 },
            { title: 'Done', order: 2 },
          ],
        },
      },
      include: {
        columns: {
          include: {
            cards: true,
          },
        },
      },
    });
  },
  
  // Helper to create test data
  async createTestCard(columnId: string, content = 'Test Card', order = 0) {
    return prisma.card.create({
      data: {
        content,
        order,
        columnId,
      },
    });
  },
}; 