# 🚀 Database Explorer — High-Performance MongoDB Studio & AI Query Assistant

[![Node.js](https://img.shields.io/badge/Node.js-24.x-emerald?logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-cyan?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Native_Driver-green?logo=mongodb)](https://www.mongodb.com)
[![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini_2.5_Flash-purple?logo=google)](https://ai.google.dev)
[![Tests](https://img.shields.io/badge/Tests-8%2F8_Passing-success?logo=jest)](https://jestjs.io)

**Database Explorer** is a production-grade, full-stack web application designed for exploring, querying, inspecting, and managing MongoDB databases. Built as a high-performance database management studio, it demonstrates low-level MongoDB driver connection pooling, dynamic schema auto-discovery, interactive visual query builders, a stage-by-stage aggregation pipeline visualizer, responsive multi-theme design, and an integrated **AI Natural Language Query Assistant powered by Google Gemini 2.5 Flash**.

---

## ✨ Key Features & Capabilities

### 1. 🔌 Dynamic Connection Manager & Safety Guards
- **Multi-Connection Support**: Seamlessly connect to local standalone instances (`mongodb://localhost:27017`) or cloud **MongoDB Atlas** clusters.
- **Diagnostic TCP Connection Ping**: Live TCP socket test measuring real round-trip network latency in milliseconds.
- **Credential Masking**: Automatically masks database credentials and passwords in URI displays for privacy and security.
- **Read-Only Safety Guard**: Visual lock preventing accidental write, update, or delete operations in production environments.
- **Encrypted Local Storage Profiles**: Easily save and manage multiple connection profiles with custom labels and color tags.

### 2. 🎨 5 Built-in Studio Themes & Dynamic Monaco Synchronization
- **Theme Options**:
  - 🌿 **MongoDB Compass**: Dark Emerald (`theme-mongo`)
  - 🌅 **Postman Sunset**: Dark Orange (`theme-postman`)
  - 💻 **VS Code Midnight**: Dark Blue (`theme-vscode`)
  - 👾 **Cyberpunk Neon**: Dark Pink & Cyan (`theme-cyberpunk`)
  - ☀️ **Studio Clean**: Modern Light Mode (`theme-light`)
- **Monaco Editor Theme Sync**: Monaco Editor automatically synchronizes syntax highlighting between `vs-dark` and `light` modes based on the active theme.

### 3. 📱 Fully Responsive Layout & Mobile Navigation
- **Adaptive Breakpoints**: Seamless experience across desktop, tablet, and mobile screens.
- **Mobile Drawer Navigation**: Slide-out sidebar drawer with backdrop blur accessible via header hamburger menu on screens under 1024px.
- **Responsive Workspace**: Fluid horizontal tables, auto-collapsing panels, and touch-friendly interactive buttons.

### 4. 🗂️ Multi-Tab Collection Workspace Bar
- **Tabbed Browsing**: Open multiple collections simultaneously across different databases.
- **Active State Highlighting**: Instantly switch between collections with persistent queries, view modes, and pagination states.
- **Tab Management**: Close individual tabs or switch workspaces effortlessly.

### 5. 📑 Document Explorer Suite & Multi-View Modes
- **Table View**: Dynamic column auto-generation with sortable headers, pagination controls, and nested object popovers.
- **Tree View**: Interactive collapsible JSON tree viewer with BSON type badges and quick dot-path copying.
- **Monaco Code View**: Full JSON code viewer powered by Monaco Editor with syntax highlighting and formatting.
- **Robust CRUD Operations**:
  - Safe document updates stripping immutable `_id` fields to eliminate `MongoServerError`.
  - Delete operations with automatic 24-char hex string and EJSON `$oid` conversion to BSON `ObjectId`.
- **JSON & CSV Export**: One-click dataset export for external analysis.

### 6. 🛠️ Visual Query Builder & Raw Code Editor
- **Dual Query Mode**:
  - **Visual Builder**: Dropdown-driven filter builder (`$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$regex`, `$in`, `$exists`) with quick-field tags.
  - **Raw Editor**: Monaco Editor for `Filter`, `Projection`, and `Sort` clauses with `Ctrl+Enter` shortcut execution.
- **Query Benchmarking**: Live execution time calculation in milliseconds.

### 7. ⚡ Aggregation Pipeline Visualizer & Stage Inspector
- **Stage-by-Stage Construction**: Easily append pipeline stages (`$match`, `$group`, `$project`, `$sort`, `$lookup`, `$unwind`, `$limit`).
- **Live Stage Inspector**: Inspect document output after *each individual stage* to debug complex aggregation workflows.
- **Distribution Charting**: Integrated Recharts bar charts auto-generated for numeric `$group` stage results.

### 8. 📊 Schema Auto-Discovery & Index Management
- **Automatic Schema Inference**: Samples top documents (10, 50, 100, 200, or 500) to automatically infer field names, nested properties, BSON types (`ObjectId`, `Date`, `Array`, `Number`, `String`), and nullability ratios.
- **Live Index Inspector**: Inspect index names, key directions, unique constraints, and drop or create new indexes directly from the UI.

### 9. 📈 Live Cluster Diagnostics & Query Execution Plans
- **Explain Query Execution Plan**: Inspect winning execution stages, total documents examined vs returned, execution time, and index keys used.
- **Server Diagnostics**: Real-time MongoDB cluster health displaying server host, version, uptime, active connections, and live OpCounters (inserts, queries, updates, deletes).

### 10. 🔖 Saved Query Snippets & Execution History
- **Saved Snippets**: Bookmark frequently used queries with custom titles and collection scoping.
- **Execution History**: Chronological log of recent queries with execution timestamps and 1-click re-run functionality.

### 11. ⌨️ Command Palette (`Ctrl + K`)
- Fast keyboard shortcut menu to quickly switch databases, toggle between Document Explorer and Aggregation Pipeline, or launch the AI assistant.

### 12. 🤖 AI Natural Language Query Assistant (Google Gemini 2.5 Flash)
- **Natural Language Translation**: Converts plain English prompts (e.g. *"Find active users created in 2024 with total spend over 500 sorted by spend"*) into executable MongoDB filter objects or aggregation pipelines.
- **Custom API Key Support**: Configure a custom Google Gemini API key directly from the header popover or fallback to the server environment key.
- **Query Explainer**: Step-by-step plain English breakdown of any query along with performance tips and indexing advice.

---

## 🏗️ Architecture & Project Structure

```
DB Explorer/
├── package.json                          # Monorepo orchestration scripts (dev, build, test, seed)
├── issues.md                             # Comprehensive QA audit & resolution verification report
├── server/                               # Express Backend (TypeScript + Native Mongo Driver)
│   ├── src/
│   │   ├── config/                       # Environment & Gemini configuration
│   │   ├── controllers/                  # Connection, Document, Aggregation, Schema, AI controllers
│   │   ├── routes/                       # Express API route declarations
│   │   ├── services/                     # MongoConnectionManager, AIService
│   │   ├── utils/                        # EJSON parser/serializer
│   │   ├── scripts/                      # Sample MongoDB seed script (seed.ts)
│   │   ├── api.test.ts                   # Jest API integration tests
│   │   └── index.ts                      # Express server entry point
│   ├── jest.config.js                    # Jest configuration
│   ├── tsconfig.json
│   └── package.json
└── client/                               # React Frontend (TypeScript + Vite + TanStack Start + Tailwind CSS)
    ├── src/
    │   ├── components/
    │   │   ├── Aggregation/              # AggregationBuilder & stage inspector
    │   │   ├── AIAssistant/              # AIAssistantDrawer (Gemini 2.5 Flash)
    │   │   ├── CommandPalette/           # CommandPalette (Ctrl+K)
    │   │   ├── Connection/               # ConnectionModal (with live TCP ping test)
    │   │   ├── DocumentViewer/           # DocumentViewer (Table/Tree/JSON) & DocumentModal
    │   │   ├── Header/                   # Header & WorkspaceTabBar
    │   │   ├── Performance/              # ExplainPlanModal & ServerStatusModal
    │   │   ├── QueryBuilder/             # QueryBuilder & QueryHistoryDrawer
    │   │   ├── Schema/                   # SchemaInspectorModal & CreateCollectionModal
    │   │   └── Sidebar/                  # Responsive Sidebar (Desktop & Mobile Drawer)
    │   ├── context/                      # ConnectionContext (State, Profiles, Tabs, History)
    │   ├── routes/                       # TanStack Start unified routing
    │   ├── App.tsx                       # Main Studio application shell
    │   ├── main.tsx                      # Vite React client entry
    │   └── index.css                     # Multi-theme CSS variables & studio styles
    ├── tsconfig.json
    └── package.json
```

---

## 🛠️ Quick Start & Installation

### Prerequisites
- **Node.js**: v18.x or higher (tested on Node.js 24)
- **MongoDB**: Local standalone MongoDB daemon (`mongodb://127.0.0.1:27017`) or cloud MongoDB Atlas connection URI.

---

### 1. Install Dependencies

Install all root, server, and client dependencies with a single command from the root directory:
```bash
npm run install:all
```

Or install individually:
```bash
# Root dependencies
npm install

# Server dependencies
npm install --prefix server

# Client dependencies
npm install --prefix client
```

---

### 2. Populate Sample Data (Optional)

Seed your local MongoDB instance with realistic E-Commerce and Analytics test datasets:
```bash
npm run seed
```
*This populates `ecommerce_db` (users, products, orders) and `analytics_db` (logs).*

---

### 3. Run Development Servers

Start both the backend server (Port 5000) and frontend client (Port 3000) concurrently:
```bash
npm run dev
```

Open your web browser and navigate to:
```
http://localhost:3000
```

---

## 🧪 Automated Testing & Verification

The server includes an automated integration test suite running on Jest with live MongoDB integration:
```bash
npm test
```

### Test Coverage Highlights:
- ✅ Query documents with skip/limit pagination
- ✅ Update documents with **immutable `_id` protection** (no `MongoServerError`)
- ✅ Insert new documents with EJSON support
- ✅ Delete documents with **BSON `ObjectId` conversion** (hex string & `$oid` matching)
- ✅ EJSON Extended JSON serialization/deserialization

---

## 🔐 Environment Variables (.env)

Create an optional `.env` file in the `server` directory:
```env
PORT=5000
DEFAULT_MONGO_URI=mongodb://127.0.0.1:27017
GEMINI_API_KEY=your_google_gemini_api_key_here
```

> **Note:** If `GEMINI_API_KEY` is not provided in `.env`, users can still configure their custom Gemini API key directly in the web UI header popover.

---

## 📦 Production Build

To compile both backend TypeScript and client Vite + Nitro production bundles:
```bash
npm run build
```

The compiled server outputs to `server/dist/` and the client outputs to `client/.output/`.

---

## 📄 License & Attribution

This project is open-source and built for developers seeking a modern, fast, and feature-complete MongoDB database management experience.
