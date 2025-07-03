import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { Board } from './components/Board';
import { useBoardStore } from './store/board.store';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/board/:id" element={<BoardPage />} />
        </Routes>
      </main>
    </div>
  );
}

function Header() {
  const navigate = useNavigate();
  const { createBoard } = useBoardStore();
  const [creating, setCreating] = useState(false);

  const handleCreateBoard = async () => {
    setCreating(true);
    const boardId = await createBoard();
    setCreating(false);
    
    if (boardId) {
      navigate(`/board/${boardId}`);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <h1 className="text-2xl font-bold text-gray-900 cursor-pointer" onClick={() => navigate('/')}>
            Kanban Board
          </h1>
          <button 
            onClick={handleCreateBoard}
            disabled={creating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating...' : 'Create New Board'}
          </button>
        </div>
      </div>
    </header>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const { createBoard, loading, error } = useBoardStore();
  const [creating, setCreating] = useState(false);

  const handleCreateFirstBoard = async () => {
    setCreating(true);
    const boardId = await createBoard();
    setCreating(false);
    
    if (boardId) {
      navigate(`/board/${boardId}`);
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Welcome to Kanban Board
      </h2>
      <p className="text-gray-600 mb-8">
        Create and share Kanban boards with anyone, no login required.
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 max-w-md mx-auto">
          {error}
        </div>
      )}
      
      <button 
        onClick={handleCreateFirstBoard}
        disabled={creating || loading}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {creating ? 'Creating Your Board...' : 'Create Your First Board'}
      </button>
    </div>
  );
}

function BoardPage() {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return (
      <div className="text-center">
        <p className="text-red-600">Invalid board ID</p>
      </div>
    );
  }

  return <Board boardId={id} />;
}

export default App;
