# 🚀 Database Explorer — High-Performance MongoDB Studio & AI Query Assistant

[![Node.js](https://img.shields.io/badge/Node.js-24.x-emerald)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-cyan)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Native_Driver-green)](https://www.mongodb.com)
[![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini_2.5_Flash-purple)](https://ai.google.dev)

**Database Explorer** is a production-grade, full-stack web application designed for exploring, querying, inspecting, and managing MongoDB databases. Built as a showcase project for a **Full-Stack Developer**, it demonstrates low-level MongoDB driver connection pooling, dynamic schema auto-discovery, interactive visual query builders, a stage-by-stage aggregation pipeline visualizer, and an integrated **AI Natural Language Query Assistant**.

---

## ✨ Key Features & Highlights

### 1. 🔌 Dynamic Connection Manager & Safety Guards
- **Multi-Connection Support**: Seamlessly connect to local standalone instances (`mongodb://localhost:27017`) or cloud **MongoDB Atlas** clusters.
- **Diagnostic Connection Ping**: Live connection testing with latency measurement in milliseconds.
- **Read-Only Safety Guard**: Optional safety toggle preventing accidental write/delete operations in production environments.
- **Encrypted Local Storage Profiles**: Easily save and manage multiple connection profiles with custom labels and color tags.

### 2. 📊 Schema Auto-Discovery Engine & Index Inspector
- **Automatic Schema Inference**: Samples top documents to automatically infer field names, nested properties, BSON types (`ObjectId`, `Date`, `Array`, `Number`, `String`), and nullability ratios.
- **Index Inspector**: Detailed view of index names, key directions, unique constraints, and metrics.

### 3. 📑 Document Explorer Suite & Multi-View Modes
- **Table View**: Dynamic column auto-generation with sortable headers and pagination controls.
- **Tree View**: Interactive collapsible tree viewer with BSON type badges and quick key path copying.
- **Monaco Editor View**: High-performance JSON code viewer powered by Monaco Editor with syntax highlighting.
- **CRUD Operations**: Create, edit, and delete documents with real-time JSON validation and Extended JSON ($date, $oid) support.
- **JSON & CSV Export**: One-click dataset export.

### 4. 🛠️ Visual Query Builder & Raw Mongo Query Editor
- **Dual Mode**:
  - **Visual Builder**: Dropdown-driven filter builder (`$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$regex`, `$in`, `$exists`).
  - **Raw Code Editor**: Monaco Editor for `Filter`, `Projection`, and `Sort` clauses with `Ctrl+Enter` shortcut execution.
- **Query Benchmarking**: Execution time calculation in milliseconds.

### 5. ⚡ Aggregation Pipeline Visualizer & Stage Inspector
- **Stage-by-Stage Construction**: Easily append pipeline stages (`$match`, `$group`, `$project`, `$sort`, `$lookup`, `$unwind`, `$limit`).
- **Live Stage Inspector**: Inspect document output after *each individual stage* to easily debug complex aggregation logic.
- **Distribution Charting**: Integrated Recharts bar charts auto-generated for numeric `$group` stage results.

### 6. 🤖 AI Natural Language Query Assistant (Gemini 2.5 Flash)
- **Natural Language Translation**: Converts plain English prompts (e.g. *"Find active users created in 2024 with total spend over 500 sorted by spend"*) into executable MongoDB filter objects or aggregation pipelines.
- **Query Explainer**: Step-by-step plain English breakdown of any query along with performance tips and indexing advice.

---

## 🏗️ Architecture & Project Structure

```
DB Explorer/
├── package.json              # Monorepo orchestration scripts
├── server/                   # Express Backend (TypeScript + Native Mongo Driver)
│   ├── src/
│   │   ├── config/           # Environment & Gemini configuration
│   │   ├── controllers/      # Connection, Document, Aggregation, Schema, AI controllers
│   │   ├── services/         # MongoConnectionManager, AIService
│   │   ├── utils/            # EJSON parser/serializer
│   │   ├── scripts/          # Sample MongoDB seed script (seed.ts)
│   │   └── index.ts          # Express server entry point
│   ├── tsconfig.json
│   └── package.json
└── client/                   # React Frontend (TypeScript + Vite + Tailwind CSS)
    ├── src/
    │   ├── components/       # Header, Sidebar, Connection, DocumentViewer, QueryBuilder, Aggregation, Schema, AIAssistant
    │   ├── context/          # ConnectionContext
    │   ├── App.tsx
    │   └── main.tsx
    ├── tsconfig.json
    └── package.json
```

---

## 🛠️ Quick Start & Installation

### Prerequisites
- **Node.js**: v18.x or higher
- **MongoDB**: Local standalone Mongo daemon running on `mongodb://localhost:27017` or Mongo Atlas URI.

### 1. Install Dependencies
In the root directory, install all server and client dependencies:
```bash
npm run dev
```

Or install individually:
```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### 2. Populate Sample Seed Data (Optional)
Populate your local MongoDB with sample E-Commerce and Analytics collections:
```bash
npm run seed
```

### 3. Run Development Servers
Start both backend (Port 5000) and frontend (Port 3000) concurrently:
```bash
npm run dev
```
Navigate to `http://localhost:3000` in your web browser.

---

## 🔐 Environment Variables (.env)

Create a `.env` file in the `server` directory (optional):
```env
PORT=5000
DEFAULT_MONGO_URI=mongodb://localhost:27017
GEMINI_API_KEY=your_google_gemini_api_key_here
```

---

## 🧪 Build & Production Deployment

To build both backend and frontend applications for production:
```bash
npm run build
```