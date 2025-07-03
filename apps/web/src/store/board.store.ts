import { create } from 'zustand';
import apiClient from '../utils/api';

// Define types based on our backend schema
interface Card {
  id: string;
  content: string;
  order: number;
}

interface Column {
  id: string;
  title: string;
  order: number;
  cards: Card[];
}

interface Board {
  id: string;
  title: string;
  createdAt: Date;
  columns: Column[];
}

interface BoardState {
  board: Board | null;
  loading: boolean;
  error: string | null;
}

interface BoardActions {
  loadBoard: (boardId: string) => Promise<void>;
  updateBoard: (boardId: string, updates: Partial<Board>) => Promise<void>;
  moveCard: (cardId: string, sourceColumnId: string, targetColumnId: string, targetOrder: number) => Promise<void>;
  addCard: (columnId: string, content?: string) => Promise<void>;
  editCard: (cardId: string, content: string) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type BoardStore = BoardState & BoardActions;

export const useBoardStore = create<BoardStore>((set, get) => ({
  // Initial state
  board: null,
  loading: false,
  error: null,

  // Actions
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),

  loadBoard: async (boardId: string) => {
    try {
      set({ loading: true, error: null });
      
      const result = await apiClient.getBoard(boardId);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      set({ board: result.data || null, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load board';
      set({ error: errorMessage, loading: false });
    }
  },

  updateBoard: async (boardId: string, updates: Partial<Board>) => {
    try {
      set({ loading: true, error: null });
      
      const result = await apiClient.updateBoard(boardId, updates);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      set({ board: result.data || null, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update board';
      set({ error: errorMessage, loading: false });
    }
  },

  moveCard: async (cardId: string, sourceColumnId: string, targetColumnId: string, targetOrder: number) => {
    try {
      set({ error: null });
      
      // TODO: Implement card move API call
      // For now, just update local state optimistically
      const { board } = get();
      if (!board) return;
      
      // Optimistic update - move card locally
      const updatedColumns = board.columns.map(column => {
        if (column.id === sourceColumnId) {
          return {
            ...column,
            cards: column.cards.filter(card => card.id !== cardId)
          };
        }
        if (column.id === targetColumnId) {
          const cardToMove = board.columns
            .find(col => col.id === sourceColumnId)
            ?.cards.find(card => card.id === cardId);
          
          if (cardToMove) {
            const newCards = [...column.cards];
            newCards.splice(targetOrder, 0, { ...cardToMove, order: targetOrder });
            return { ...column, cards: newCards };
          }
        }
        return column;
      });
      
      set({ board: { ...board, columns: updatedColumns } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to move card';
      set({ error: errorMessage });
    }
  },

  addCard: async (columnId: string, content = 'New card') => {
    try {
      set({ error: null });
      
      // TODO: Implement add card API call
      // For now, just update local state optimistically
      const { board } = get();
      if (!board) return;
      
      const newCard: Card = {
        id: `card-${Date.now()}`, // Temporary ID
        content,
        order: board.columns.find(col => col.id === columnId)?.cards.length || 0
      };
      
      const updatedColumns = board.columns.map(column => {
        if (column.id === columnId) {
          return {
            ...column,
            cards: [...column.cards, newCard]
          };
        }
        return column;
      });
      
      set({ board: { ...board, columns: updatedColumns } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add card';
      set({ error: errorMessage });
    }
  },

  editCard: async (cardId: string, content: string) => {
    try {
      set({ error: null });
      
      // TODO: Implement edit card API call
      // For now, just update local state optimistically
      const { board } = get();
      if (!board) return;
      
      const updatedColumns = board.columns.map(column => ({
        ...column,
        cards: column.cards.map(card => 
          card.id === cardId ? { ...card, content } : card
        )
      }));
      
      set({ board: { ...board, columns: updatedColumns } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to edit card';
      set({ error: errorMessage });
    }
  },

  deleteCard: async (cardId: string) => {
    try {
      set({ error: null });
      
      // TODO: Implement delete card API call
      // For now, just update local state optimistically
      const { board } = get();
      if (!board) return;
      
      const updatedColumns = board.columns.map(column => ({
        ...column,
        cards: column.cards.filter(card => card.id !== cardId)
      }));
      
      set({ board: { ...board, columns: updatedColumns } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete card';
      set({ error: errorMessage });
    }
  },
})); 