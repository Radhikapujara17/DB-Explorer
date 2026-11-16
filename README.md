# 🚀 MongoLens — Next-Gen MongoDB Web GUI, Query Studio & Compass Alternative

<p align="center">
  <img src="client/public/logo.svg" alt="MongoLens Studio Logo" width="340" />
</p>

<p align="center">
  <strong>High-Performance Visual Web GUI for MongoDB with In-Line Editing, Aggregation Pipeline Studio & Gemini AI Query Copilot</strong>
</p>

<p align="center">
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-24.x-emerald?logo=node.js" alt="Node.js" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-cyan?logo=react" alt="React" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript" alt="TypeScript" /></a>
  <a href="https://www.mongodb.com"><img src="https://img.shields.io/badge/MongoDB-Native_Driver-green?logo=mongodb" alt="MongoDB" /></a>
  <a href="https://ai.google.dev"><img src="https://img.shields.io/badge/AI-Google_Gemini_2.5_Flash-purple?logo=google" alt="Google Gemini" /></a>
  <a href="https://jestjs.io"><img src="https://img.shields.io/badge/Tests-9%2F9_Passing-success?logo=jest" alt="Tests" /></a>
</p>

**MongoLens** is a modern, production-grade web-based MongoDB GUI and query studio designed as a lightweight, zero-install alternative to MongoDB Compass. Engineered for high performance and visual clarity, it delivers native driver connection pooling, dynamic schema discovery, spreadsheet-style in-line editing, multi-stage aggregation pipeline visualization, zero-FOUC multi-theme hydration, and an integrated **AI Natural Language Query Assistant powered by Google Gemini 2.5 Flash**.

---

## ✨ Key Features & Capabilities

### 1. 🔌 Guided Connection Form Builder & Safety Guards
- **Dual Connection Modes**: Toggle between **Guided Form Builder** and **Raw Connection URI** input.
- **Form Builder Fields**: Guided configuration for protocol scheme (Standard `mongodb://` vs Atlas SRV `mongodb+srv://`), Host, Port, Database, Username, Password (with show/hide eye toggle), Auth Source (`admin`), SSL/TLS, and Direct Connection.
- **Live Generated URI Preview**: Dynamically compiles and displays the real-time URI with a 1-click **Copy URI** button.
- **Diagnostic TCP Connection Ping**: Live TCP socket test measuring real round-trip network latency in milliseconds.
- **Credential Masking**: Automatically masks database credentials and passwords in URI displays for privacy and security.
- **Server & Client Read-Only Safety Guards**: Visual lock and server-side HTTP 403 rejection preventing accidental write, update, or delete operations.

### 2. ⚡ In-Line Table Cell Editing
- **Double-Click to Edit**: Double-click any table cell in Table View (excluding immutable primary key `_id` and action columns) to edit values in-place.
- **Smart Type Parsing**: Automatically preserves numeric, boolean, null, and JSON object/array data types upon saving.
- **Keyboard Shortcuts**: Press `Enter` to commit changes immediately, or press `Escape` to cancel with zero changes.

### 3. 🏷️ Visual BSON Type Badges
- **Rich Type Badges**:
  - `OID`: Purple badge for MongoDB `ObjectId` (e.g. `672b123...`).
  - `DATE`: Amber badge for `ISODate` / timestamp strings.
  - `INT64`: Blue badge for 64-bit long integer values (`$numberLong`).
  - `DEC`: Emerald badge for 128-bit high-precision decimals (`$numberDecimal`).
  - `BIN`: Rose badge for binary data (`$binary`).
  - `ARR`: Indigo badge for arrays displaying element count (`ARR [3]`).
  - `OBJ`: Slate badge for embedded objects (`OBJ`).
  - `BOOL`: Pink badge for boolean values.
  - `NUM`: Cyan badge for formatted numeric fields.

### 4. 📄 Offset Pagination & Direct Page Jump
- **Complete Pagination Toolbar**:
  - `⏮` **First Page** (`ChevronsLeft`): Jump directly to page 1.
  - `◀` **Previous Page** (`ChevronLeft`): Navigate back 1 page.
  - **Page Jump Input**: Numeric text input `Page [ X ] of Y` where typing a page number and pressing Enter jumps directly to any page with boundary validation.
  - `▶` **Next Page** (`ChevronRight`): Navigate forward 1 page.
  - `⏭` **Last Page** (`ChevronsRight`): Jump directly to the final page.
- **Expanded Page Limits**: Choose between `10, 25, 50, 100, 250, 500` rows per page.
- **Formatted Range Counter**: `Showing 1–50 of 1,420 records` with locale-formatted numbers.

### 5. 🛡️ Destructive Action Confirmation Safeguards
- **GitHub-Style Type-to-Confirm Dialog**: Replacing risky browser alerts, destructive actions require typing confirmation (`delete` for documents or the collection name for drops).
- **Disabled Submit Guard**: The confirmation button remains disabled until the input matches the target name exactly.
- **Read-Only Lock**: Completely locks destruction modals when Read-Only mode is enabled.

### 6. 🚀 60fps Table Virtualization
- **Windowed Rendering**: Integrated `@tanstack/react-virtual` renders only the visible rows in the viewport plus overscan buffers.
- **Padding Row Pattern**: Preserves native HTML `<table>`, `<thead>`, and `<tbody>` formatting, auto-calculated column widths, and sticky table headers without CSS grid misalignment.
- **Butter-Smooth Scrolling**: Silky 60fps scrolling even when rendering large datasets with 500 rows per page.

### 7. 🔒 Server-Side Query Execution Guards
- **Query Timeout Enforcement**: All queries and document counts enforce `maxTimeMS(5000)` to eliminate cluster-hanging unbounded operations. Aggregation pipelines enforce `maxTimeMS(10000)`.
- **Arbitrary Code Execution Blacklist**: Server recursively blocks dangerous operators containing arbitrary JavaScript execution risks (`$where`, `$function`, `$accumulator`).
- **Backend Read-Only Enforcement**: Mutation endpoints (`insert`, `update`, `delete`, `createCollection`, `dropCollection`) strictly enforce `x-readonly` headers and return **HTTP 403 Forbidden**.

### 8. 📦 Advanced Data Export Wizard
- **Multiple Formats**:
  - **CSV / Excel**: Includes optional Excel UTF-8 BOM (`\uFEFF`) to prevent garbled international characters, customizable delimiters (Comma `,`, Semicolon `;`, Tab `\t`), and quote escaping.
  - **NDJSON (Lines)**: Newline-delimited JSON objects compatible with `mongoimport` and cloud data pipelines.
  - **JSON Array**: Formatted with 2-space pretty-print indentation or minified.
- **Scope Selection**: Export Current Page View vs Selected Rows Only (with selection count badge).
- **Field Selection**: Interactive checkboxes to include or exclude specific fields with 1-click Select All / Deselect All.
- **Live Output Preview**: Preview the first 2 records formatted in real-time before downloading.

### 9. 📥 In-Browser Data Import Wizard
- **3-Step Guided Wizard**:
  - **Step 1: Upload File**: Drag-and-drop zone accepting `.json` (array), `.csv` (comma-separated), or `.ndjson`.
  - **Step 2: Preview & Settings**: Shows total parsed documents, sample JSON preview of the first 2 documents, duplicate conflict handling (`Skip duplicates` vs `Abort on error`), and batch size selection (`50`, `200`, `500`).
  - **Step 3: Progress & Summary**: Live progress bar showing `Imported X of Y (Z%)` with a final report of inserted and skipped records. Automatically refreshes collection metrics on completion.

### 10. 🧭 TanStack Router Frontend Architecture
- **Typed Deep-Linkable Routes**:
  - `/`: Document Explorer (Query Builder, Table, Cards, Tree, JSON views).
  - `/aggregation`: Multi-Stage Aggregation Pipeline Visualizer with live stage inspector and distribution charts.
- **Browser History Support**: Full browser Back and Forward button support between Document Explorer and Aggregation Visualizer.
- **State Persistence**: Active MongoDB connection, profile, latency ping, tabs, and query state seamlessly persist across route switches.

---

## 🎨 5 Built-in Studio Themes
- 🌿 **MongoDB Compass**: Dark Emerald (`theme-mongo`)
- 🌅 **Postman Sunset**: Dark Orange (`theme-postman`)
- 💻 **VS Code Midnight**: Dark Blue (`theme-vscode`)
- 👾 **Cyberpunk Neon**: Dark Pink & Cyan (`theme-cyberpunk`)
- ☀️ **Studio Clean**: Modern Light Mode (`theme-light`)

Monaco Editor automatically synchronizes syntax highlighting between `vs-dark` and `light` modes based on the active theme.

---

## 🏗️ Architecture & Project Structure

```
DB Explorer/
├── package.json                          # Monorepo orchestration scripts (dev, build, test, seed)
├── PROJECT_IMPROVEMENT_PLAN.md           # Comprehensive 10-feature improvement and architecture plan
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
    │   │   ├── Common/                   # ConfirmDestructionModal
    │   │   ├── Connection/               # ConnectionModal (Guided Form Builder & Raw URI)
    │   │   ├── DocumentViewer/           # DocumentViewer (Virtual Table/Tree/JSON) & DocumentModal
    │   │   ├── Export/                   # ExportModal (CSV with BOM, NDJSON, JSON array)
    │   │   ├── Header/                   # Header & WorkspaceTabBar
    │   │   ├── Import/                   # ImportWizardModal (Drag & drop batch importer)
    │   │   ├── Performance/              # ExplainPlanModal & ServerStatusModal
    │   │   ├── QueryBuilder/             # QueryBuilder & QueryHistoryDrawer
    │   │   ├── Schema/                   # SchemaInspectorModal & CreateCollectionModal
    │   │   └── Sidebar/                  # Responsive Sidebar with collection drop safeguard
    │   ├── context/                      # ConnectionContext (State, Profiles, Tabs, History)
    │   ├── routes/                       # TanStack Start unified routing (/ and /aggregation)
    │   ├── App.tsx                       # Main Studio application shell
    │   ├── main.tsx                      # Vite React client entry
    │   └── index.css                     # Multi-theme CSS variables, BSON badges & studio styles
    ├── tsconfig.json
    └── package.json
```

---

## 🛠️ Quick Start & Installation

### Prerequisites
- **Node.js**: v18.x or higher (tested on Node.js 22 & 24)
- **MongoDB**: Local standalone MongoDB daemon (`mongodb://127.0.0.1:27017`) or cloud MongoDB Atlas connection URI.

---

### 1. Install Dependencies

Install all root, server, and client dependencies with a single command from the root directory:
```bash
npm run install:all
```

Or install individually:
```bash
npm install
npm install --prefix server
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

Start both the backend server (Port 5000) and frontend client (Port 8080) concurrently:
```bash
npm run dev
```

Open your web browser and navigate to:
```
http://localhost:8080
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
- ✅ Server-side query execution guards (`maxTimeMS`, operator blacklist, read-only rejection)

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
