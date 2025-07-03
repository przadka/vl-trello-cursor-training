import React, { useEffect } from 'react';
import { useBoardStore } from '../store/board.store';

interface BoardProps {
  boardId: string;
}

export const Board: React.FC<BoardProps> = ({ boardId }) => {
  const { 
    board, 
    loading, 
    error, 
    loadBoard, 
    addCard 
  } = useBoardStore();

  useEffect(() => {
    loadBoard(boardId);
  }, [boardId, loadBoard]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div 
          data-testid="loading-spinner" 
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
        />
        <span className="ml-3 text-gray-600">Loading board...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div data-testid="error-message" className="bg-red-50 border border-red-200 rounded-md p-4 m-4">
        <div className="flex items-center justify-between">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
          <button
            onClick={() => loadBoard(boardId)}
            className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No board loaded
  if (!board) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">No board data available</p>
      </div>
    );
  }

  // Board content
  return (
    <main role="main" aria-label="Kanban board" className="p-6">
      {/* Board Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{board.title}</h1>
      </div>

      {/* Empty state for board with no columns */}
      {board.columns.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No columns yet</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium">
            Add Column
          </button>
        </div>
      ) : (
        /* Board Columns */
        <div className="flex gap-6 overflow-x-auto pb-4">
          {board.columns
            .sort((a, b) => a.order - b.order)
            .map(column => (
              <div
                key={column.id}
                data-testid="board-column"
                role="region"
                aria-label={`${column.title} column with ${column.cards.length} cards`}
                data-droppable="true"
                className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900">
                    {column.title} ({column.cards.length})
                  </h2>
                  <button
                    onClick={() => addCard(column.id)}
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    Add Card
                  </button>
                </div>

                {/* Cards */}
                <div className="space-y-3">
                  {column.cards
                    .sort((a, b) => a.order - b.order)
                    .map(card => (
                      <button
                        key={card.id}
                        data-testid={`card-${card.id}`}
                        draggable="true"
                        tabIndex={0}
                        aria-label={`Card: ${card.content}`}
                        className="w-full text-left bg-white rounded-md p-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <p className="text-gray-900 text-sm">{card.content}</p>
                      </button>
                    ))}
                  
                  {/* Empty state for column */}
                  {column.cards.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-sm">No cards yet</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Screen reader announcements for drag and drop */}
      <div role="status" aria-label="Drag and drop status" aria-live="polite" className="sr-only"></div>
    </main>
  );
}; 