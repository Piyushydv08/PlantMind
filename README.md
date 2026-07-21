# PlantMind — AI Intelligence Platform for Data Centre EPC Project Delivery

**Team:** NextGen
**Event:** ET AI Hackathon 2026
**Problem Statement 4:** AI Intelligence Platform for Data Centre EPC Project Delivery

---

## Overview

PlantMind unifies fragmented EPC project data — specifications, vendor submittals, maintenance
logs, compliance checklists, and schedule risk records — into a single retrieval-augmented
intelligence layer. Instead of engineers and site teams searching across disconnected PDFs,
spreadsheets, and email threads, PlantMind lets them ask a question and get a cited, contextual
answer, or run an automated check against regulatory and specification standards.

The platform was built around a real Indian industrial knowledge base (OISD-116, Factory Act 1948,
pump/heat-exchanger SOPs) and has been extended with data-centre-specific content — Uptime
Institute Tier IV standards, ASHRAE TC 9.9 thermal guidelines, NBC fire codes, equipment registers,
vendor spec submittals, and schedule delay records — so the same intelligence layer that verifies a
refinery SOP can verify a data hall UPS submittal against its EPR specification.

## Features

| Objective (Problem Statement) | Implemented As |
|---|---|
| Specification Compliance | `compliance.agent.js` checks procedures/equipment against ingested regulation + spec text, and the demo data includes vendor-submittal-vs-EPR deviation flags (`datacenter_spec_submittals.json`) |
| Schedule Risk Prediction | Dashboard alarm engine parses `datacenter_schedule_delays.csv` for critical-path delay triggers (supplier strikes, customs bottlenecks, rework) and surfaces them as ranked alarms |
| Supply Chain Intelligence | Same schedule-delay pipeline surfaces named multi-tier supply risk triggers (e.g. "German factory logistics strike affecting Siemens/ABB components") |
| RAG / Project Knowledge Assistant | `copilot.agent.js` — cited, confidence-scored Q&A over the full ingested document corpus via ChromaDB + Groq Llama 3.3 |
| Quality Management | Compliance checklist parsing (`datacenter_compliance_checklist.txt`) drives non-compliance/partial-compliance alarms on the dashboard |
| Commissioning Intelligence | Partially covered via equipment register condition tracking (inspection overdue flags); a dedicated commissioning test-sequence agent is a recommended next step |
| Predictive Analytics | `maintenance.agent.js` — structured RCA with 5-whys, likelihood-ranked causes, and predictive maintenance scheduling |

## Screenshots

*(Insert dashboard, copilot chat, compliance checker, and knowledge graph screenshots here)*

## Architecture Diagram

*(See `ARCHITECTURE.md` for full Mermaid diagrams — high-level flow placeholder below)*

```
User → Next.js Frontend → Express API → RAG Service → ChromaDB (vector store)
                                       → Groq (Llama 3.3 70B) → Structured JSON response
```

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 18, TypeScript, Tailwind CSS, D3.js, Axios, Lucide icons
- **Backend:** Node.js, Express 4
- **Vector DB:** ChromaDB
- **Embeddings:** `@xenova/transformers` — `Xenova/all-MiniLM-L6-v2` (local, no external embedding API)
- **LLM:** Groq — `llama-3.3-70b-versatile`
- **Document parsing:** `pdf-parse`, `mammoth` (DOCX), native for TXT/CSV
- **File upload:** Multer

## Folder Structure

```
plantmind/
├── backend/
│   ├── agents/            # copilot.agent.js, maintenance.agent.js, compliance.agent.js
│   ├── services/          # ingestion.service.js, rag.service.js
│   ├── routes/             # api.routes.js
│   ├── demo-docs/          # seed knowledge base (refinery + data centre docs)
│   ├── scripts/            # generate-demo-data.js
│   └── server.js
└── frontend/
    └── src/
        ├── app/            # /, /copilot, /maintenance, /compliance, /graph, /upload
        └── components/     # layout, ui
```

## Installation

```bash
git clone <repo-url>
cd plantmind
```

### Environment Variables (`backend/.env`)

```env
GROQ_API_KEY=your_groq_api_key
CHROMA_URL=http://localhost:8000
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### Running ChromaDB

```bash
pip install chromadb
chroma run --port 8000
```

### Running the Backend

```bash
cd backend
npm install
node scripts/generate-demo-data.js   # one-time: seeds and ingests demo knowledge base
npm run dev
```

### Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`.

## API Documentation

See `API.md` for the full endpoint reference. Core endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/query` | RAG copilot Q&A |
| POST | `/api/maintenance/analyze` | Failure RCA |
| GET | `/api/maintenance/schedule/:equipmentId` | Predictive maintenance schedule |
| POST | `/api/compliance/check` | Compliance audit |
| GET | `/api/compliance/calendar` | Compliance calendar |
| POST | `/api/graph` | Knowledge graph query |
| POST | `/api/upload` | Ingest a new document |
| GET | `/api/documents` | List ingested documents |
| GET | `/api/dashboard/stats` | Aggregated safety/compliance/alarm stats |

## Project Workflow

1. Documents (specs, SOPs, checklists, registers) are uploaded or seeded, chunked, embedded, and stored in ChromaDB.
2. Users query via the Copilot, Maintenance, or Compliance modules.
3. Each agent retrieves relevant chunks, builds a context block, and prompts Groq for a structured response.
4. The dashboard independently parses the same demo documents at request time to surface live alarms and a computed safety/compliance index.

## Future Scope

See `FUTURE_SCOPE.md` — commissioning test-sequence agent, structured database layer replacing file-parsing, authentication, and geospatial supply-chain tracking are the priority additions.

## Contributors

Team NextGen

## License

MIT (update as appropriate for submission rules)

## Acknowledgements

Built for ET AI Hackathon 2026, Problem Statement 4. Uses Groq, ChromaDB, and Xenova Transformers.
