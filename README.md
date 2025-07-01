# Kanban Board Demo

A lightweight web-based Kanban board that anyone can create and share by URL—no login required.

## ✨ Features

- **No Authentication**: Create boards instantly without signup
- **Shareable URLs**: Access boards via unguessable URLs (`/board/{id}`)
- **Drag & Drop**: Intuitive card management with keyboard accessibility
- **Persistent Storage**: Boards save automatically and persist indefinitely
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Real-time Updates**: Changes reflect on page reload (no live collaboration in demo)

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Drag & Drop**: Dnd-Kit
- **Backend**: Fastify + TypeScript
- **Database**: SQLite with Prisma ORM
- **Testing**: Vitest + React Testing Library + Playwright
- **Deployment**: Docker + Railway/Render

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd vl-trello-cursor-training

# Install dependencies
pnpm install

# Set up the database
pnpm db:setup

# Start development servers
pnpm dev
```

This will start:
- Frontend dev server at `http://localhost:5173`
- Backend API server at `http://localhost:3000`

### Build for Production

```bash
# Build all packages
pnpm build

# Start production server
pnpm start
```

## 📁 Project Structure

```
kanban-app/
├── apps/
│   ├── web/              # React frontend
│   └── api/              # Fastify backend
├── packages/
│   ├── config/           # Shared configs
│   └── types/            # Shared TypeScript types
├── prisma/               # Database schema & migrations
└── docker/               # Containerization
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test:unit       # Unit & component tests
pnpm test:api        # API integration tests
pnpm test:e2e        # End-to-end tests

# Type checking
pnpm typecheck
```

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/boards` | Create new board |
| `GET` | `/boards/{id}` | Get board data |
| `PUT` | `/boards/{id}` | Update entire board |

## 🔧 Environment Variables

```bash
# Backend (.env)
DATABASE_URL="file:./kanban.db"
PORT=3000
NODE_ENV=development
```

## 🚢 Deployment

### Docker

```bash
# Build image
docker build -t kanban-app .

# Run container
docker run -p 8080:8080 kanban-app
```

### Railway/Render

The app is configured for easy deployment to Railway or Render. See `technical_design.md` for detailed deployment instructions.

## 🎯 Demo Simplifications

This is a demo application that prioritizes simplicity:

- **Conflict Resolution**: Last write wins (no optimistic locking)
- **Error Handling**: Basic error messages with simple retry
- **Mobile Experience**: Uses dnd-kit defaults
- **Rate Limiting**: Simple per-IP limits

## 🔮 Future Enhancements

- Real-time collaboration with WebSockets
- Read-only share links
- Board templates
- PWA offline support
- Optional authentication layer

## 📄 License

MIT License - see LICENSE file for details

---

**Built with ❤️ as a demo project** 