import { z } from 'zod';

// Board schemas
export const CreateBoardSchema = z.object({
  title: z.string().optional(),
});

export const BoardSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.date(),
  columns: z.array(z.object({
    id: z.string(),
    title: z.string(),
    order: z.number(),
    cards: z.array(z.object({
      id: z.string(),
      content: z.string(),
      order: z.number(),
    })),
  })),
});

// Types
export type CreateBoardRequest = z.infer<typeof CreateBoardSchema>;
export type Board = z.infer<typeof BoardSchema>;

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}
