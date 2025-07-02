import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

export interface CreateBoardData {
  title?: string;
}

export interface BoardUpdateData {
  title: string;
  columns: Array<{
    id: string;
    title: string;
    order: number;
    cards: Array<{
      id: string;
      content: string;
      order: number;
    }>;
  }>;
}

export interface BoardData {
  id: string;
  title: string;
  createdAt: Date;
  columns: Array<{
    id: string;
    title: string;
    order: number;
    cards: Array<{
      id: string;
      content: string;
      order: number;
    }>;
  }>;
}

export class BoardService {
  constructor(private prisma: PrismaClient) {}

  async createBoard(data: CreateBoardData): Promise<{ id: string; title: string; createdAt: Date }> {
    const boardId = nanoid();
    const title = data.title || 'My Kanban Board';

    // Create board
    const board = await this.prisma.board.create({
      data: {
        id: boardId,
        title,
      },
    });

    // Create default columns
    const defaultColumns = [
      { title: 'Todo', order: 0 },
      { title: 'In Progress', order: 1 },
      { title: 'Done', order: 2 },
    ];

    for (const columnData of defaultColumns) {
      await this.prisma.column.create({
        data: {
          id: nanoid(),
          title: columnData.title,
          order: columnData.order,
          boardId,
        },
      });
    }

    return {
      id: board.id,
      title: board.title,
      createdAt: board.createdAt,
    };
  }

  async getBoardById(id: string): Promise<BoardData | null> {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            cards: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!board) {
      return null;
    }

    return {
      id: board.id,
      title: board.title,
      createdAt: board.createdAt,
      columns: board.columns.map(column => ({
        id: column.id,
        title: column.title,
        order: column.order,
        cards: column.cards.map(card => ({
          id: card.id,
          content: card.content,
          order: card.order,
        })),
      })),
    };
  }

  async updateBoard(id: string, data: BoardUpdateData): Promise<void> {
    // This will be implemented when we get to the corresponding test
    throw new Error('Not implemented yet - will be driven by tests');
  }
} 