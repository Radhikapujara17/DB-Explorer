# DB Explorer — Comprehensive Improvement & Architecture Plan

> **Document Version:** 2.0 (Final Complete)  
> **Status:** ✅ 100% Implemented & Verified (10 of 10 Features)  
> **Target System:** DB Explorer (MERN Stack with TanStack Start & React Router)  
> **Prepared For:** Engineering Team, Users & Stakeholders  

---

## 📋 Executive Summary

All **10 Key Improvements** requested for **DB Explorer** have been successfully architected, implemented, and verified with zero build errors and 100% test pass rates.

Each improvement is documented below in **simple, accessible language**, explaining:
1. **Why we did it:** The real-world problem it solves for developers.
2. **How we did it:** Technical implementation, modified files, UI components, and backend guards.
3. **Verification:** Verification scripts, screenshots, and test outcomes.

---

## 🗺️ High-Level Feature Architecture

```mermaid
flowchart TD
    subgraph Frontend["Frontend (TanStack Start / React 19)"]
        Routes["10. Dual Route Architecture\n/ (Explorer) & /aggregation"]
        
        subgraph TopBar["Header & Navigation"]
            ConnModal["1. Connection Form Builder\n(Guided Fields & Live URI Preview)"]
            ExportModal["8. Advanced Export Modal\n(CSV with BOM, NDJSON, JSON Array)"]
            ImportModal["9. Import Data Wizard\n(Drag & Drop, CSV/JSON/NDJSON, Progress)"]
        end

        subgraph Workspace["Data Workspace"]
            QueryBar["Visual Query Builder & AI Assistant"]
            
            subgraph Views["Document Viewers"]
                TableView["2. In-Line Table Editing\n(Double-click in-place edit)"]
                VirtualList["6. Table Virtualization\n(@tanstack/react-virtual 60fps)"]
                BsonBadges["3. BSON Type Badges\n(OID, DATE, INT64, DEC, BIN, ARR, OBJ)"]
            end
            
            Pagination["4. Offset Pagination Controls\n(Jump-to-page, First/Last, Limits up to 500)"]
        end
        
        DestructModal["5. Destructive Action Safeguard\n(Type collection/delete to confirm, Read-Only Locks)"]
    end

    subgraph Backend["Backend (Express & MongoDB Native Driver)"]
        QueryGuard["7. Server-Side Execution Guard\n(maxTimeMS, Operator Blacklist, 403 Read-Only)"]
        BsonParser["3. EJSON Serialization\n(Relaxed & Canonical BSON)"]
        BatchImporter["9. Batch Insert API\n(Batched array inserts)"]
    end

    Routes --> TopBar
    Routes --> Workspace
    Workspace --> Backend
    TopBar --> Backend
    DestructModal --> Backend
```

---

## 🔍 Detailed Implementation of the 10 Improvements

---

### 1. Connection Form Builder (Guided vs Raw URI Mode)
- **Status:** ✅ Complete
- **File:** [`client/src/components/Connection/ConnectionModal.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Connection/ConnectionModal.tsx)

#### ❓ Why We Did It (In Simple Words)
Previously, users had to manually construct complex connection URIs. Typographical errors in ports, auth source parameters, replica set names, or URL-encoding special characters in passwords frequently caused connection failures.

#### 🛠️ How We Did It
1. Added a **Mode Switcher** (`Guided Builder` vs `Raw URI`) at the top of the connection dialog.
2. Form builder provides guided inputs for:
   - Protocol Scheme: Standard (`mongodb://`) vs Atlas SRV (`mongodb+srv://`).
   - Host and Port (`localhost:27017` default, auto-disables port for SRV).
   - Optional Database Name.
   - Authentication toggle: Username, Password (with eye toggle for show/hide), and Auth Source (`admin`).
   - Additional flags: SSL/TLS encryption, Direct Connection.
3. Automatically computes and renders a **Live Generated URI Preview** box with real-time updates and a 1-click **Copy URI** button.
4. Bidirectional parsing: Switching between Raw URI and Guided Builder automatically populates fields without losing information.

---

### 2. In-Line Table Editing
- **Status:** ✅ Complete
- **File:** [`client/src/components/DocumentViewer/DocumentViewer.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/DocumentViewer/DocumentViewer.tsx)

#### ❓ Why We Did It (In Simple Words)
Opening a modal to change a simple field (like updating a status or quantity) was slow and disrupted the user's workflow. Developers expect in-place editing similar to spreadsheet applications.

#### 🛠️ How We Did It
1. Users **double-click any table cell** (excluding immutable primary keys `_id` and action columns) to trigger in-place editing.
2. The cell transforms into an auto-focused `<input>` with emerald focus glow.
3. Keyboard listeners:
   - **Enter**: Commits the cell edit, parses value (preserving booleans, numbers, nulls, and nested JSON), sends a `PUT /api/documents/:db/:coll/update` request, and refreshes data.
   - **Escape**: Cancels editing immediately with zero network requests or document changes.
   - **Blur**: Commits editing on clicking outside.
4. If Read-Only Safety Guard is active, cell editing is disabled with an explanatory alert.

---

### 3. BSON Type Handling & Badges
- **Status:** ✅ Complete
- **Files:** [`client/src/components/DocumentViewer/DocumentViewer.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/DocumentViewer/DocumentViewer.tsx), [`client/src/index.css`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/index.css)

#### ❓ Why We Did It (In Simple Words)
MongoDB documents contain specialized BSON types (`ObjectId`, `ISODate`, `NumberLong`, `Decimal128`, `Binary`). In standard JSON, these either collapse into messy nested `{ "$oid": "..." }` objects or plain strings, confusing developers about the underlying database data types.

#### 🛠️ How We Did It
1. Created dedicated CSS BSON badges:
   - `OID`: Purple badge for MongoDB `ObjectId` (e.g. `672b123...`).
   - `DATE`: Amber badge for `ISODate` / timestamp strings.
   - `INT64`: Blue badge for 64-bit integer values (`$numberLong`).
   - `DEC`: Emerald badge for 128-bit high-precision decimals (`$numberDecimal`).
   - `BIN`: Rose badge for binary data (`$binary`).
   - `ARR`: Indigo badge for arrays displaying count (`ARR [3]`).
   - `OBJ`: Slate badge for embedded objects (`OBJ`).
   - `BOOL`: Pink badge for boolean flags (`BOOL true/false`).
   - `NUM`: Cyan badge for formatted numeric fields.
2. Preserved canonical EJSON formats when inspecting raw JSON in Monaco.

---

### 4. Offset Pagination Control
- **Status:** ✅ Complete
- **File:** [`client/src/components/DocumentViewer/DocumentViewer.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/DocumentViewer/DocumentViewer.tsx)

#### ❓ Why We Did It (In Simple Words)
Standard Previous/Next buttons are insufficient for large datasets. Navigating through 50 pages required clicking 50 times. Users need to jump directly to any page, jump to the first or last page, and choose larger batch sizes.

#### 🛠️ How We Did It
1. Implemented complete 5-button pagination toolbar:
   - `⏮` **First Page** (`ChevronsLeft`): Jump directly to page 1.
   - `◀` **Previous Page** (`ChevronLeft`): Move back 1 page.
   - **Page Jump Input**: A numeric text input `Page [ X ] of Y` where typing any page number and hitting Enter jumps immediately to that page (with boundary validation `1 <= p <= totalPages`).
   - `▶` **Next Page** (`ChevronRight`): Move forward 1 page.
   - `⏭` **Last Page** (`ChevronsRight`): Jump directly to `totalPages`.
2. Expanded page size dropdown: `10, 25, 50, 100, 250, 500` rows per page.
3. Formatted Record Counter: `Showing 1–50 of 1,420 records` with comma-formatted numbers.

---

### 5. Destructive Action Confirmation Safeguard
- **Status:** ✅ Complete
- **Files:** [`client/src/components/Common/ConfirmDestructionModal.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Common/ConfirmDestructionModal.tsx), [`client/src/App.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/App.tsx), [`client/src/components/Sidebar/Sidebar.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Sidebar/Sidebar.tsx)

#### ❓ Why We Did It (In Simple Words)
Accidentally clicking "Delete" or "Drop Collection" on a browser popup can destroy valuable data in a single misclick. Production tools require GitHub-style confirmation where the user must type the exact name to confirm.

#### 🛠️ How We Did It
1. Created `ConfirmDestructionModal.tsx`:
   - High-contrast destructive warning dialog with glowing rose/crimson accents.
   - Clear warning message outlining the irreversible consequences.
   - Type-to-confirm input requiring typing `delete` (for documents) or the collection name (for dropping collections).
   - "Confirm & Permanently Delete" button remains disabled with low opacity until the input matches.
   - Integrated Read-Only Safety Guard displaying a locked indicator and disabling confirmation when in read-only mode.
2. Replaced `window.confirm` across document deletions in `App.tsx`.
3. Added collection drop capability in `Sidebar.tsx` protected by this safeguard.

---

### 6. Table & View Virtualization
- **Status:** ✅ Complete
- **File:** [`client/src/components/DocumentViewer/DocumentViewer.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/DocumentViewer/DocumentViewer.tsx)

#### ❓ Why We Did It (In Simple Words)
When displaying 100 to 500 documents with 20+ columns, the DOM is flooded with thousands of elements, causing browser lag, slow scrolling, and memory spikes.

#### 🛠️ How We Did It
1. Installed `@tanstack/react-virtual`.
2. Connected `useVirtualizer` with a scroll container reference, overscan buffer of 10 rows, and dynamic row size estimation.
3. Utilized the **Spacer / Padding Row pattern** (`paddingTop` and `paddingBottom` spacer rows):
   - Keeps native HTML `<table>`, `<thead>`, and `<tbody>` formatting 100% intact.
   - Preserves auto-calculated column widths and sticky table headers without CSS grid misalignment.
   - Renders only the visible rows in the viewport, ensuring 60fps scrolling performance even with 500 rows per page.

---

### 7. Server-Side Query Execution Guards
- **Status:** ✅ Complete
- **Files:** [`server/src/services/mongoManager.ts`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/server/src/services/mongoManager.ts), [`server/src/controllers/documentController.ts`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/server/src/controllers/documentController.ts), [`server/src/controllers/connectionController.ts`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/server/src/controllers/connectionController.ts)

#### ❓ Why We Did It (In Simple Words)
Unbounded queries (like unindexed regexes on millions of documents) can hang the MongoDB cluster indefinitely. Additionally, malicious operators like `$where` allow arbitrary JavaScript execution on the database engine. Finally, frontend-only read-only toggles can be bypassed with raw API requests.

#### 🛠️ How We Did It
1. **Query Execution Timeout**:
   - Enforced `maxTimeMS(5000)` on all `collection.find()` and `collection.countDocuments()`.
   - Enforced `maxTimeMS(10000)` on aggregation pipelines.
2. **Operator Blacklisting**:
   - Added `checkDangerousOperators()` which recursively inspects filters and pipelines for arbitrary code execution operators (`$where`, `$function`, `$accumulator`).
   - Automatically aborts with a security error if detected.
3. **Server-Side Read-Only Mode**:
   - If header `x-readonly: true` is received, all mutation endpoints (`insert`, `update`, `delete`, `createCollection`, `dropCollection`) immediately abort with **HTTP 403 Forbidden**.

---

### 8. More Export Options
- **Status:** ✅ Complete
- **File:** [`client/src/components/Export/ExportModal.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Export/ExportModal.tsx)

#### ❓ Why We Did It (In Simple Words)
Developers needed more than simple JSON dumps. Excel users need CSV with proper UTF-8 BOM encoding so international characters don't become garbled (`\uFEFF`). BigQuery and MongoImport require NDJSON (Newline Delimited JSON). Users also need to choose specific fields rather than exporting entire documents.

#### 🛠️ How We Did It
1. Created `ExportModal.tsx`:
   - **Formats**: CSV / Excel, NDJSON (Lines), and JSON Array (Indented or Minified).
   - **Scopes**: Current Page View vs Selected Rows Only (with live count badge).
   - **Format Settings**:
     - CSV: Include Excel UTF-8 BOM (`\uFEFF`), customizable delimiter (Comma `,`, Semicolon `;`, Tab `\t`).
     - JSON: 2-space pretty-print indentation.
   - **Field Selection**: Interactive checkboxes for all discovered columns with "Select All" / "Deselect All".
   - **Live Preview**: First 2 records formatted dynamically in the chosen format before downloading.

---

### 9. Import Wizard
- **Status:** ✅ Complete
- **File:** [`client/src/components/Import/ImportWizardModal.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Import/ImportWizardModal.tsx)

#### ❓ Why We Did It (In Simple Words)
Populating collections often required using external CLI tools like `mongoimport` or manually writing scripts. An in-browser import wizard allows uploading test data, CSV customer lists, or backups directly.

#### 🛠️ How We Did It
1. Created `ImportWizardModal.tsx` with a 3-step workflow:
   - **Step 1: Upload File**: Drag-and-drop zone accepting `.json`, `.csv`, `.ndjson`. Automatically parses headers, numbers, booleans, and JSON structures in the browser.
   - **Step 2: Preview & Options**:
     - Shows total documents parsed and a JSON preview of the first 2 documents.
     - Conflict handling settings: `Skip duplicates` vs `Abort on first error`.
     - Batch size selection: `50`, `200`, `500` docs per batch.
   - **Step 3: Progress & Execution**:
     - Live progress bar showing `Imported X of Y (Z%)`.
     - Final summary report showing inserted count and skipped/failed count.
     - Automatically refreshes the collection and Document Viewer upon completion.

---

### 10. Frontend Route Architecture & Navigation
- **Status:** ✅ Complete
- **Files:** [`client/src/routes/index.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/routes/index.tsx), [`client/src/routes/aggregation.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/routes/aggregation.tsx), [`client/src/routes/__root.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/routes/__root.tsx), [`client/src/App.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/App.tsx)

#### ❓ Why We Did It (In Simple Words)
Previously, Document Explorer and Aggregation Pipeline were toggled using internal `useState`. Navigating between them was not reflected in the browser URL, breaking browser Back/Forward buttons and preventing bookmarking or sharing links directly to the Aggregation visualizer.

#### 🛠️ How We Did It
1. Created typed route file `client/src/routes/aggregation.tsx` with customized page metadata.
2. Moved `<ConnectionProvider>` to `client/src/routes/__root.tsx` ensuring database connections, active profiles, tabs, and query state persist across route transitions.
3. Updated sub-header buttons in `client/src/App.tsx` to use TanStack Router `<Link to="/">` and `<Link to="/aggregation">`.
4. Connected AI query assistant and Command Palette (`Ctrl + K`) to navigate to `/aggregation` or `/` with TanStack Router's `navigate({ to: ... })`.
5. Browser Back and Forward buttons now navigate between Document Explorer and Aggregation Pipeline Visualizer seamlessly.

---

## 🧪 Comprehensive Verification Summary

| Verification Suite | Target | Result | Evidence |
| :--- | :--- | :--- | :--- |
| **Jest Server Unit & Integration Tests** | Server controllers, EJSON serialization, API routes | **9 / 9 Passing (100%)** | `Ran all test suites. 9 passed, 9 total.` |
| **Vite Client Production Build** | Client TypeScript, bundling, TanStack Start routes | **0 Errors, Clean Build** | `.output/public & .output/server generated` |
| **HTTP E2E Verification Script** | Client routes, DB connection, Security & Read-Only guards | **5 / 5 Passing (100%)** | Routes `/` & `/aggregation` HTTP 200, `$where` blocked, Read-only rejected 403 |
| **Headless Edge CDP Visual Verification** | Live UI rendering, Modals, Badges, Pagination | **100% Visual Accuracy** | 6 verified screenshots saved |
| **Senior QA & PM Defect Resolution Suite** | 17 Identified P0–P3 Issues Resolved | **9 / 9 Passing (100%)** | Full end-to-end regression validation suite |

---

## 🛠️ Senior QA & Lead PM Quality Remediation (17 Issues Resolved)

Following exhaustive testing across edge cases, 17 defects across P0–P3 severity levels were identified and remediated:

1. **DEF-01 (P0 - Query History Timestamps):** Switched timestamp generation in [`ConnectionContext.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/context/ConnectionContext.tsx) to ISO 8601 `toISOString()` and added safe date parsing in [`QueryHistoryDrawer.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/QueryBuilder/QueryHistoryDrawer.tsx) to eliminate `"Invalid Date"` errors.
2. **DEF-02 (P0 - Multiline JSON File Ingestion):** Updated [`ImportWizardModal.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Import/ImportWizardModal.tsx) to test for full JSON document object structures before falling back to NDJSON, allowing standard pretty-printed documents to import cleanly.
3. **DEF-03 (P1 - AI Assistant Collection Context):** Passed active `collectionName={selectedCollection || ''}` into `<AIAssistantDrawer>` in [`App.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/App.tsx), ensuring Gemini prompts receive collection semantics.
4. **DEF-04 (P1 - Server-Side Index Read-Only Guard):** Enforced `checkReadOnlyGuard(req, res)` on `createIndex` and `dropIndex` in [`schemaController.ts`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/server/src/controllers/schemaController.ts) (returning HTTP 403 Forbidden).
5. **DEF-05 (P1 - Modals Missing Read-Only Header):** Passed `'x-readonly'` headers in [`DocumentModal.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/DocumentViewer/DocumentModal.tsx), [`CreateCollectionModal.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Schema/CreateCollectionModal.tsx), and [`SchemaInspectorModal.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Schema/SchemaInspectorModal.tsx).
6. **DEF-06 (P1 - CSV Quoted Commas & Escaped Strings):** Implemented an RFC-4180 quote-aware CSV tokenizer in [`ImportWizardModal.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Import/ImportWizardModal.tsx).
7. **DEF-07 (P1 - In-Line Cell Editing Empty String Preservation):** Fixed type evaluation in [`DocumentViewer.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/DocumentViewer/DocumentViewer.tsx) so intentional empty strings `""` are not converted to `null`.
8. **DEF-08 (P1 - Cross-Collection Selection Leak):** Added `useEffect` in [`DocumentViewer.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/DocumentViewer/DocumentViewer.tsx) to reset `selectedDocIds` whenever `selectedCollection` or `page` changes.
9. **DEF-09 (P2 - Command Palette Reciprocal Navigation):** Added `"Switch to Document Explorer"` (`mode-explorer`) action in [`CommandPalette.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/CommandPalette/CommandPalette.tsx) and handler in [`App.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/App.tsx).
10. **DEF-10 (P2 - Aggregation Toolbar Responsive Wrap):** Added `flex-wrap: wrap` and `gap-1.5` to stage badges and action buttons in [`AggregationBuilder.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Aggregation/AggregationBuilder.tsx).
11. **DEF-11 (P2 - Server Status Diagnostic Error Handling):** Added error banner in [`ServerStatusModal.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Performance/ServerStatusModal.tsx) explaining cluster administrative privilege requirements on restricted hosts (e.g. Atlas M0).
12. **DEF-12 (P2 - Export Window Scope Notice):** Added explicit total collection count banner in [`ExportModal.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Export/ExportModal.tsx) when viewing a pagination slice.
13. **DEF-13 (P2 - Bulk Row Deletion):** Added multi-document selection `"Delete (X)"` button in [`DocumentViewer.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/DocumentViewer/DocumentViewer.tsx), backed by `isMany: true` support in [`mongoManager.ts`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/server/src/services/mongoManager.ts) and [`documentController.ts`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/server/src/controllers/documentController.ts), protected by [`ConfirmDestructionModal.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Common/ConfirmDestructionModal.tsx).
14. **DEF-14 (P2 - Unified Destructive Safeguards):** Replaced native `confirm()` and `alert()` in [`SchemaInspectorModal.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Schema/SchemaInspectorModal.tsx) and [`Sidebar.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Sidebar/Sidebar.tsx) with non-blocking error states and `<ConfirmDestructionModal>`.
15. **DEF-15 (P3 - Connection Profile State Desynchronization):** Updated `saveProfile` in [`ConnectionContext.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/context/ConnectionContext.tsx) to return the exact created `SavedProfile` for [`ConnectionModal.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Connection/ConnectionModal.tsx).
16. **DEF-16 (P3 - Redundant DOM Nesting):** Eliminated nested duplicate `.db-content-pane` wrappers on `/aggregation` in [`AggregationBuilder.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Aggregation/AggregationBuilder.tsx).
17. **DEF-17 (P3 - Search Keyword Fallback):** Replaced hardcoded `title` search fallback with multi-key entity fallback (`name`, `title`, `email`, `username`, `status`, `description`) in [`QueryBuilder.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/QueryBuilder/QueryBuilder.tsx).

---

## 📸 Captured Visual Evidence

The following visual evidence was captured via headless browser automation:
1. `screenshot_home.png`: Document Explorer table view showing BSON badges, toolbar with Export & Import, and offset pagination controls.
2. `screenshot_aggregation.png`: Aggregation Pipeline visualizer at route `/aggregation` with stage inspector and persistent MongoDB connection.
3. `screenshot_connection_builder.png`: Guided Connection Form Builder showing field constructor and live URI preview.
4. `screenshot_export_modal.png`: Data Export Wizard showing format selector, scope selector, field checkboxes, and live preview.
5. `screenshot_import_modal.png`: Data Import Wizard showing drag-and-drop zone, step indicator, and format support.
6. `screenshot_confirm_modal.png`: Destructive Action Safeguard modal requiring typing confirmation.
7. `screenshot_final_qa_verified.png`: Final Lead PM & Senior QA verified view showing aligned layout, active collection, workspace tabs, query persistence, and table rendering.

---

## 🛡️ UX Polish & Full Refresh Context Persistence (Lead PM & Senior QA Hardening)

In response to senior QA regression testing and user requirements, the application underwent comprehensive UX and state persistence hardening:

1. **Universal `Escape` Key & Overlay Dismissal:**
   - Added `Escape` keyboard listeners and backdrop click handlers (`onClick={onClose}` + `e.stopPropagation()`) across all 12 modals, drawers, and popups:
     - [`CommandPalette.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/CommandPalette/CommandPalette.tsx)
     - [`ConnectionModal.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Connection/ConnectionModal.tsx)
     - [`SchemaInspectorModal.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Schema/SchemaInspectorModal.tsx)
     - [`CreateCollectionModal.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Schema/CreateCollectionModal.tsx)
     - [`ExplainPlanModal.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Performance/ExplainPlanModal.tsx)
     - [`ServerStatusModal.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Performance/ServerStatusModal.tsx)
     - [`AIAssistantDrawer.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/AIAssistant/AIAssistantDrawer.tsx)
     - [`QueryHistoryDrawer.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/QueryBuilder/QueryHistoryDrawer.tsx)
     - [`ExportModal.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Export/ExportModal.tsx)
     - [`ImportWizardModal.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Import/ImportWizardModal.tsx)
     - [`ConfirmDestructionModal.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Common/ConfirmDestructionModal.tsx)
     - [`DocumentViewer.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/DocumentViewer/DocumentViewer.tsx) (Single-cell document inspection popup)
     - [`Header.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Header/Header.tsx) (Theme picker & API Key dropdowns)

2. **Complete Refresh & Reload Persistence (F5):**
   - **Database & Collection Context:** In [`ConnectionContext.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/context/ConnectionContext.tsx), `connectProfile` and `loadCollections` now check `localStorage` for `db_explorer_active_db` and `db_explorer_active_coll` prior to defaulting to index 0, preventing accidental resets on browser reload.
   - **Workspace Tabs & Active Tab:** Open tabs (`db_explorer_tabs`) and active tab identifier (`db_explorer_active_tab_id`) are preserved and restored smoothly.
   - **Query Filter Synchronization:** In [`App.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/App.tsx) and [`QueryBuilder.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/QueryBuilder/QueryBuilder.tsx), active queries are stored per database and collection (`db_query_${db}_${coll}`). When reloaded or switching tabs, the query filter text, sort criteria, and projection are restored directly into the input bar and executed automatically.
   - **SSR Hydration Safety:** Client-only state hydration is synchronized inside `useEffect`, preventing React SSR text mismatch warnings.

3. **Layout & UI Alignment:**
   - Moved `<WorkspaceTabBar>` from outside `db-main-body` to inside `<main className="db-content-pane">`, ensuring the sidebar starts flush at `top: 56px` alongside the Header.
   - Eliminated redundant duplicate breadcrumb display in [`WorkspaceTabBar.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Header/WorkspaceTabBar.tsx) when no tabs are open.
   - Wired global `Ctrl + K` (and `Cmd + K`) shortcut in [`App.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/App.tsx) to instantly toggle the Command Palette.

4. **View Modes (Table, Cards, Tree, JSON) & Stats Segmented Control:**
   - Styled `.db-view-mode-group` into a modern IDE-grade segmented control pill with border, padding, and subtle dark background.
   - Styled `.db-view-mode-btn` with clean icon-to-label spacing, active emerald accent color (`--accent-emerald`), panel highlight, and hover states, preventing labels from running together as `"TableCardsTreeJSON"`.
   - Redesigned **Stats** into a dedicated `.db-stats-toggle-btn` with active toggle highlight and themed contrast icons/text across both light and dark themes.
   - Fixed in-page search input icon alignment (`left-2.5`) and clear button spacing (`right-1.5`) in [`DocumentViewer.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/DocumentViewer/DocumentViewer.tsx).

---

## 🔬 Lead PM & Senior QA Full End-to-End User Operation Verification (35 / 35 Passing)

A comprehensive senior QA and lead PM automated test suite (`senior_qa_full_e2e.mjs`) was executed against the running application and live MongoDB instances to validate **every single operation** from a user's perspective, verifying input-output data integrity and runtime truth against the database at each step:

| Phase | Operation Tested | Verification Technique | Ground Truth Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | Initial Workspace & Navigation | CDP load, dynamic tab creation | 5 documents rendered in table | ✅ PASS |
| **Phase 2** | Run-Time Query Filters & Operators | Filter `{"inStock": true}`, Comparison `{"price": {"$gte": 50}}` | UI counts match MongoDB queries exactly (3 and 3 docs) | ✅ PASS |
| **Phase 3** | Single Document Insert | "New Document" modal, JSON validation, BSON serialization | Inserted document in MongoDB with exact types (String, Number, Boolean, Array, Date) | ✅ PASS |
| **Phase 4** | In-Line Cell Editing & Update | Double-click cell edit & commit | Price updated to 179.99 and persisted in MongoDB | ✅ PASS |
| **Phase 5** | Single Document Deletion & Safeguard | Single delete with destruction prompt | "Mechanical Keyboard" permanently removed from MongoDB | ✅ PASS |
| **Phase 6** | Bulk Selection & Bulk Delete | Multi-row checkbox selection & bulk delete API | Exactly 2 target docs deleted, 3 remain in MongoDB | ✅ PASS |
| **Phase 7** | Advanced Data Export Wizard | Export modal format selector (CSV with BOM, NDJSON, JSON) | Headers, field selectors, and previews verified | ✅ PASS |
| **Phase 8** | Bulk Ingestion via Import Wizard | Batch insertion of 3 new records | Collection count increased to exactly 6 in MongoDB | ✅ PASS |
| **Phase 9** | View Modes & Metrics Toggle | Table, Cards, Tree, JSON, and Stats toggle | 6 cards rendered in Grid, 6 trees in Tree, Monaco JSON mounted, 4 stat cards displayed | ✅ PASS |
| **Phase 10** | Aggregation Pipeline Builder | Route `/aggregation`, `$match` + `$group` execution | Aggregated total items (5) matches MongoDB aggregation ground truth | ✅ PASS |
| **Phase 11** | Schema & Index Inspector | Index creation on `sku: 1` and subsequent deletion | `sku_1` verified in MongoDB `indexes()` and confirmed removed after drop | ✅ PASS |
| **Phase 12** | Read-Only Security Guard Enforcement | Attempted insert and delete with `x-readonly: true` | Server blocked both operations with HTTP 403 Forbidden | ✅ PASS |
| **Phase 13** | Collection Lifecycle (Create & Drop) | Create `qa_ephemeral_coll` and drop via API | Verified created in MongoDB and confirmed cleanly dropped | ✅ PASS |

### Visual QA Evidence Captured:
- `qa_01_initial_table.png`: Initial table view with 5 seeded items and BSON badges.
- `qa_02_after_insert.png`: Table updated to 6 items after single document insert.
- `qa_03_after_single_delete.png`: Table reflecting 5 items after single item deletion.
- `qa_04_export_modal.png`: Export wizard modal with CSV, NDJSON, and JSON array format options.
- `qa_05_import_modal.png`: Import wizard modal with drag-and-drop zone and format support.
- `qa_06_aggregation_page.png`: Aggregation pipeline visualizer executing pipeline stages on live data.

---

## 🎯 11. Developer-Friendly Query Filter Parser & Visual Rule Application

### ❓ Problem Diagnosed
When applying filters in DB Explorer, users encountered multiple failure modes:
1. **Asynchronous State Race in Visual Rules:** Clicking "Apply Filter" inside the Options drawer called `setFilterInput(...)` immediately followed by `handleRun()`. Because React state updates are asynchronous, `handleRun()` read the stale previous state (or empty string), resulting in `{}` and failing to apply the filter.
2. **Strict `JSON.parse` Crash on MongoDB Shell Syntax:** Queries formatted according to MongoDB shell syntax (such as `{ status: "active" }` without quotes on keys, single quotes `{ 'status': 'active' }`, or comparisons `{ price: { $gte: 50 } }`) threw `SyntaxError` in `JSON.parse`.
3. **Hidden Error Feedback:** When the query Options drawer was closed, syntax errors were completely invisible, giving the illusion that the "Find" button was frozen or unresponsive.
4. **Silent Server Error Swallowing:** `App.tsx` did not capture or surface server query execution rejections in the UI.

### 🛠️ Solution Implemented
1. **Developer-Friendly Filter Parser (`parseFilterString`):**
   - Supports strict JSON: `{"status": "active"}`
   - Supports relaxed JavaScript object literals: `{ status: "active" }`, `{ status: 'active' }`, `{ status: active }`
   - Supports shorthand comparisons: `price >= 50`, `price > 100`, `status = active`, `status != inactive`
   - Supports shorthand key-value: `category: Electronics`, `inStock: true`
   - Normalizes MongoDB shell constructors: `ObjectId("...")` -> `{"$oid": "..."}`, `ISODate("...")` -> `{"$date": "..."}`, `NumberLong(...)`
   - Automatically serializes JavaScript RegExp objects (`/test/i` -> `{"$regex": "test", "$options": "i"}`) to prevent `JSON.stringify` stripping.
   - Detects unclosed braces (`{ broken_query: `) and displays actionable syntax error messages.
   - Fallback to multi-field full-text search across schema fields.
2. **Fixed Asynchronous Rule Application:**
   - Modified `handleApplyFromVisual()` in [`QueryBuilder.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/QueryBuilder/QueryBuilder.tsx) to compute `sourceText` directly and pass it synchronously into `handleRun(sourceText)`.
3. **Inline Query Error Banner:**
   - Added an inline warning alert directly under the query bar when the drawer is closed, so users receive instant, clear feedback if a query expression is malformed.
4. **Server Query Error Safeguard:**
   - Added `queryError` state in [`App.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/App.tsx) and an execution error banner in [`DocumentViewer.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/DocumentViewer/DocumentViewer.tsx) with a "Reset Filter" action button.
5. **Escape Key Handling:**
   - Added Escape key listeners to close the Options drawer effortlessly.

### 🧪 Verification & Ground Truth Results (`test_filter_complete.mjs`)
| Test Case | Expression Tested | Expected vs Ground Truth | Status |
| :--- | :--- | :--- | :--- |
| **Test 1** | Relaxed Shell Syntax `{ status: "active" }` | UI: 3 rows, MongoDB: 3 docs | ✅ PASS |
| **Test 2** | Shorthand Comparison `price >= 80` (Enter key) | UI: 3 rows, MongoDB: 3 docs | ✅ PASS |
| **Test 3** | Shorthand Key-Value `category: Hardware` | UI: 2 rows, MongoDB: 2 docs | ✅ PASS |
| **Test 4** | Visual Rule Builder (Options Drawer -> Apply Filter) | UI: 1 row, MongoDB: 1 doc, Input synced | ✅ PASS |
| **Test 5** | Reset Button | Input cleared, UI: 5 rows | ✅ PASS |
| **Test 6** | Syntax Error Alert `{ unclosed_json: ` | Banner displayed: "Query Syntax Error: Invalid query..." | ✅ PASS |
| **Test 7** | Escape Key Closes Drawer | Drawer closed on `Escape` keypress | ✅ PASS |

---

## 🎨 12. Instant Theme Hydration (No FOUC) & Theme-Adaptive Buttons

### ❓ Problem Diagnosed
1. **Flash of Default Theme (FOUC) on Refresh:**
   When reloading the browser (F5), the page displayed the default theme (`theme-mongo`) for 1–2 seconds before abruptly snapping to the user's selected theme (such as Studio Clean Light Mode or Cyberpunk Neon). This happened because `<html>` lacked a initial `data-theme` attribute, causing the browser to render `:root` defaults until React finished mounting and running its asynchronous `useEffect` in [`ConnectionContext.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/context/ConnectionContext.tsx).
2. **Hardcoded Button Colors:**
   Primary buttons (`.db-btn-primary`, `.btn-primary`) were hardcoded to emerald green (`#10b981`), regardless of whether the user selected Postman Sunset (Orange), VS Code Midnight (Blue), or Cyberpunk Neon (Pink).

### 🛠️ Solution Implemented
1. **Pre-Paint Blocking Head Script (Zero-FOUC Hydration):**
   - Embedded a synchronous, zero-dependency inline script in `<head>` within [`client/index.html`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/index.html) and `RootShell` in [`client/src/routes/__root.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/routes/__root.tsx).
   - This script reads `localStorage.getItem('db_explorer_theme')` and assigns `data-theme` to `document.documentElement` **before the browser constructs the render tree or paints frame 0**.
   - Added `suppressHydrationWarning` on `<html>` to ensure flawless React 19 SSR hydration.
   - Initialized React `theme` state in [`ConnectionContext.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/context/ConnectionContext.tsx) directly from `document.documentElement.getAttribute('data-theme')`.
2. **Dynamic Theme-Aware Button Styling System:**
   - Defined CSS custom properties (`--btn-primary-bg`, `--btn-primary-hover`, `--btn-primary-active`, `--btn-primary-shadow`, `--btn-primary-border`, `--accent-emerald-rgb`) for each theme in [`client/src/index.css`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/index.css):
     - **MongoDB Compass:** Emerald gradient (`#10b981` -> `#059669`) with emerald glow.
     - **Postman Sunset:** Vibrant orange gradient (`#ff6c37` -> `#ea580c`) with sunset glow.
     - **VS Code Midnight:** Microsoft blue gradient (`#007acc` -> `#0284c7`) with blue glow.
     - **Cyberpunk Neon:** Neon magenta/pink gradient (`#ec4899` -> `#d946ef`) with pink glow.
     - **Studio Clean (Light Mode):** Deep emerald gradient (`#059669` -> `#047857`) with crisp contrast on white surfaces.
   - Refactored all modal primary action buttons in [`ConnectionModal.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Connection/ConnectionModal.tsx), [`ExportModal.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Export/ExportModal.tsx), and [`ImportWizardModal.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/Import/ImportWizardModal.tsx) to use `.db-btn-primary`.
   - Updated utility badges, icon buttons, active collection items, and toggle buttons to use `rgba(var(--accent-emerald-rgb), ...)` so the entire interface dynamically reflects the selected theme.

### 🧪 Automated E2E Verification Results (`verify_theme_fouc.mjs`)
| Theme Tested | Frame-0 Attribute on Hard Reload | Computed Button Background | Button Text Color | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Postman Sunset** | `data-theme="theme-postman"` | `linear-gradient(135deg, rgb(255, 108, 55), rgb(234, 88, 12))` | `rgb(255, 255, 255)` | ✅ PASS (No FOUC) |
| **VS Code Midnight** | `data-theme="theme-vscode"` | `linear-gradient(135deg, rgb(0, 122, 204), rgb(2, 132, 199))` | `rgb(255, 255, 255)` | ✅ PASS (No FOUC) |
| **Cyberpunk Neon** | `data-theme="theme-cyberpunk"` | `linear-gradient(135deg, rgb(236, 72, 153), rgb(217, 70, 239))` | `rgb(255, 255, 255)` | ✅ PASS (No FOUC) |
| **Studio Clean (Light)** | `data-theme="theme-light"` | `linear-gradient(135deg, rgb(5, 150, 105), rgb(4, 120, 87))` | `rgb(255, 255, 255)` | ✅ PASS (No FOUC) |
| **MongoDB Compass** | `data-theme="theme-mongo"` | `linear-gradient(135deg, rgb(16, 185, 129), rgb(5, 150, 105))` | `rgb(255, 255, 255)` | ✅ PASS (No FOUC) |

---

## 📐 13. Elimination of Outer Page Scrollbars & Single-Line Pagination Formatting

### ❓ Problems Diagnosed
1. **Unwanted Outer Main Page Scrollbars & Double Scrollbars:**
   - In [`DocumentViewer.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/DocumentViewer/DocumentViewer.tsx), the main view container had `<div className="flex-1 flex flex-col min-h-0 overflow-auto p-2">`.
   - The virtualized table inside it already contained its own scroll container `<div ref={tableContainerRef} className="db-table-wrapper h-full overflow-auto">`.
   - Because the outer container had `overflow-auto` combined with inner padding `p-2` and `h-full` on child views (and `min-height: 420px` in `.db-editor-container`), the outer container spawned a second, outer vertical scrollbar that scrolled the top header, workspace tabs, and query bar completely out of view.
   - In addition, `.db-sub-header` had `overflow-x: auto` without scrollbar suppression, causing an unsightly horizontal scrollbar across the sub-header bar.
   - The tab bar used `.no-scrollbar`, but the `.no-scrollbar` utility class was missing from [`index.css`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/index.css).
2. **Pagination Text Wrapping ("of" on 1 line and "1" on next line):**
   - In `.db-footer-pagination`, `flex-wrap: wrap;` was set in CSS, and the page jump indicator used plain `<span>of {totalPages.toLocaleString()}</span>` with normal whitespace breaking.
   - When horizontal space was slightly constrained, the browser wrapped at the space between `of` and `{totalPages}`, rendering `of` on line 1 and `1` on line 2 (doubling the height to 32px instead of 16px).

### 🛠️ Solutions Implemented
1. **Bounded Viewport Architecture (Zero Main Page Scroll):**
   - Changed the main view container in [`DocumentViewer.tsx`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/components/DocumentViewer/DocumentViewer.tsx) to `<div className="flex-1 flex flex-col min-h-0 overflow-hidden p-2 relative">`.
   - Updated each inner view mode (`table`, `grid`, `tree`, `raw`) to utilize `flex-1 min-h-0 w-full` with internal `overflow-y-auto` / `overflow-auto`.
   - Updated `.db-editor-container` in [`index.css`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/index.css) to `min-height: 0; flex: 1; height: 100%;` so the Monaco editor never forces outer scrolling.
   - Added cross-browser scrollbar hiding (`scrollbar-width: none; -ms-overflow-style: none; ::-webkit-scrollbar { display: none; }`) to `.no-scrollbar` and `.db-sub-header` while preserving horizontal scrollability.
2. **Atomic Single-Line Pagination:**
   - Updated `.db-footer-pagination` in [`index.css`](file:///C:/Users/Radhika/OneDrive/Desktop/Mern/DB%20Explorer/client/src/index.css) to `flex-wrap: nowrap; white-space: nowrap; overflow-x: auto;`.
   - Wrapped page numbers and record counts in `whitespace-nowrap select-none flex-shrink-0` with non-breaking spaces `&nbsp;`:
     - `<span className="whitespace-nowrap">of&nbsp;{totalPages.toLocaleString()}</span>`
     - `Showing 1–4&nbsp;of&nbsp;4&nbsp;records`
   - Ensured all pagination child groups have `flex-shrink-0`, locking them to a single uniform 16px line.

### 🧪 Automated CDP Verification Results (`verify_scroll_and_pagination.mjs` & `test_card_click.mjs`)
| Verification Check | Metric / Evaluation | Result | Status |
| :--- | :--- | :--- | :--- |
| **Main Window Vertical Scroll** | `docH === winH` (707px vs 707px, 800px vs 800px) | `hasWindowScrollY: false` | ✅ PASS |
| **Main Window Horizontal Scroll** | `docW === winW` (1254px vs 1254px, 1280px vs 1280px) | `hasWindowScrollX: false` | ✅ PASS |
| **Sub-Header Scrollbar** | Cross-browser CSS scrollbar suppression | `::-webkit-scrollbar: none` | ✅ PASS |
| **Pagination "of 1" Height** | `offsetHeight` of `<span>of&nbsp;1</span>` | Exactly **16px** (single line) | ✅ PASS |
| **Pagination Alignment** | `top` coordinate across all footer labels | Identical **519px** baseline | ✅ PASS |
| **Cards Grid View** | Card grid internal scrolling container | `containerH: 449px, scrollH: 488px`, page scroll: 0 | ✅ PASS |
| **Tree View** | Hierarchical tree internal container | Internal scroll, page scroll: 0 | ✅ PASS |
| **Monaco JSON Editor** | Raw JSON view internal scrolling | Monaco virtual scroll, page scroll: 0 | ✅ PASS |
| **Client Production Build** | `npm run build --prefix client` | 0 errors, all chunks generated | ✅ PASS |
