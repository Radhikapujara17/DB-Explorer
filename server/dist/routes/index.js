"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const connectionController_js_1 = require("../controllers/connectionController.js");
const documentController_js_1 = require("../controllers/documentController.js");
const aggregationController_js_1 = require("../controllers/aggregationController.js");
const schemaController_js_1 = require("../controllers/schemaController.js");
const aiController_js_1 = require("../controllers/aiController.js");
const router = (0, express_1.Router)();
// Connection & Metadata Routes
router.post('/connect/test', connectionController_js_1.testConnection);
router.get('/databases', connectionController_js_1.getDatabases);
router.get('/collections/:dbName', connectionController_js_1.getCollections);
router.post('/collections/:dbName/create', connectionController_js_1.createCollection);
router.delete('/collections/:dbName/:collectionName', connectionController_js_1.dropCollection);
router.get('/server/status', connectionController_js_1.getServerStatus);
// Document CRUD Routes
router.post('/documents/:dbName/:collectionName/query', documentController_js_1.queryDocuments);
router.post('/documents/:dbName/:collectionName/insert', documentController_js_1.insertDocument);
router.put('/documents/:dbName/:collectionName/update', documentController_js_1.updateDocument);
router.delete('/documents/:dbName/:collectionName/delete', documentController_js_1.deleteDocument);
// Aggregation Pipeline Routes
router.post('/aggregation/:dbName/:collectionName/execute', aggregationController_js_1.executeAggregation);
// Schema, Index & Explain Plan Routes
router.get('/schema/:dbName/:collectionName/infer', schemaController_js_1.inferSchema);
router.get('/indexes/:dbName/:collectionName', schemaController_js_1.listIndexes);
router.post('/indexes/:dbName/:collectionName/create', schemaController_js_1.createIndex);
router.delete('/indexes/:dbName/:collectionName/:indexName', schemaController_js_1.dropIndex);
router.post('/documents/:dbName/:collectionName/explain', schemaController_js_1.explainQuery);
// AI Query Assistant Routes
router.post('/ai/generate', aiController_js_1.generateQuery);
router.post('/ai/explain', aiController_js_1.explainQuery);
exports.default = router;
