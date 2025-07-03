const API_BASE_URL = 'http://localhost:3000/api';

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

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { error: errorMessage };
    }
  }

  async getBoard(boardId: string): Promise<ApiResponse<Board>> {
    return this.request<Board>(`/boards/${boardId}`);
  }

  async createBoard(title: string): Promise<ApiResponse<Board>> {
    return this.request<Board>('/boards', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async updateBoard(boardId: string, updates: { title?: string }): Promise<ApiResponse<Board>> {
    return this.request<Board>(`/boards/${boardId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Future card operations
  async addCard(boardId: string, columnId: string, content: string) {
    return this.request(`/boards/${boardId}/cards`, {
      method: 'POST',
      body: JSON.stringify({ columnId, content }),
    });
  }

  async updateCard(boardId: string, cardId: string, updates: { content?: string }) {
    return this.request(`/boards/${boardId}/cards/${cardId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteCard(boardId: string, cardId: string) {
    return this.request(`/boards/${boardId}/cards/${cardId}`, {
      method: 'DELETE',
    });
  }

  async moveCard(
    boardId: string,
    cardId: string,
    sourceColumnId: string,
    targetColumnId: string,
    targetOrder: number
  ) {
    return this.request(`/boards/${boardId}/cards/${cardId}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ sourceColumnId, targetColumnId, targetOrder }),
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient; 