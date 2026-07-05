# PlantMind

PlantMind is a full-stack project utilizing a Next.js frontend and a Node.js + Express backend.

## Project Structure

```text
/plantmind
  ├── backend/           # Node.js + Express API
  │   ├── demo-docs/     # Uploaded/Demo document files (.gitkeep)
  │   ├── uploads/       # Directory for processing file uploads (.gitkeep)
  │   ├── .env           # Backend environment variables
  │   ├── .env.example   # Example environment variables template
  │   ├── index.js       # Express entry point
  │   └── package.json   # Backend scripts and dependencies
  │
  ├── frontend/          # Next.js 14 Web Application
  │   ├── src/           # App Router + UI components
  │   ├── components.json# shadcn/ui configuration
  │   └── package.json   # Frontend scripts and dependencies
  └── README.md          # Project setup and run guide (this file)
```

---

## Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (v18+ recommended) installed.

---

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. The dependencies are already installed. If needed, run:
   ```bash
   npm install
   ```
3. Set up the environment variables:
   Copy `.env.example` to `.env` (already done by the scaffold) and fill in the values:
   ```env
   GROQ_API_KEY=your_key_here
   CHROMA_URL=http://localhost:8000
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   Or run the production start script:
   ```bash
   npm start
   ```

---

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. The dependencies are already installed. If needed, run:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```
4. Build the application for production:
   ```bash
   npm run build
   ```
5. Start the production server:
   ```bash
   npm start
   ```

# Terminal 1 — ChromaDB
python -m pip install chromadb
chroma run --port 8000

# Terminal 2 — Backend
cd plantmind/backend
npm install
node scripts/generate-demo-data.js   ← run once for demo data
npm run dev

# Terminal 3 — Frontend
cd plantmind/frontend
npm install
npm run dev