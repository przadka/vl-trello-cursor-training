import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Kanban Board
            </h1>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Create New Board
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/board/:id" element={<BoardPage />} />
        </Routes>
      </main>
    </div>
  );
}

function HomePage() {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Welcome to Kanban Board
      </h2>
      <p className="text-gray-600 mb-8">
        Create and share Kanban boards with anyone, no login required.
      </p>
      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg">
        Create Your First Board
      </button>
    </div>
  );
}

function BoardPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Board View Coming Soon...
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['To Do', 'In Progress', 'Done'].map((columnTitle) => (
          <div key={columnTitle} className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-800 mb-4">{columnTitle}</h3>
            <div className="space-y-2">
              <div className="bg-gray-50 p-3 rounded border">
                Sample card content
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
