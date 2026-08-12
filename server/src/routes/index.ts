import { Router } from 'express';
import { testConnection, getDatabases, getCollections, createCollection, dropCollection, getServerStatus } from '../controllers/connectionController.js';
import { queryDocuments, insertDocument, updateDocument, deleteDocument } from '../controllers/documentController.js';
import { executeAggregation } from '../controllers/aggregationController.js';
import { inferSchema, listIndexes, createIndex, dropIndex, explainQuery } from '../controllers/schemaController.js';
import { generateQuery, explainQuery as aiExplainQuery } from '../controllers/aiController.js';

const router = Router();

// Connection & Metadata Routes
router.post('/connect/test', testConnection);
router.get('/databases', getDatabases);
router.get('/collections/:dbName', getCollections);
router.post('/collections/:dbName/create', createCollection);
router.delete('/collections/:dbName/:collectionName', dropCollection);
router.get('/server/status', getServerStatus);

// Document CRUD Routes
router.post('/documents/:dbName/:collectionName/query', queryDocuments);
router.post('/documents/:dbName/:collectionName/insert', insertDocument);
router.put('/documents/:dbName/:collectionName/update', updateDocument);
router.delete('/documents/:dbName/:collectionName/delete', deleteDocument);

// Aggregation Pipeline Routes
router.post('/aggregation/:dbName/:collectionName/execute', executeAggregation);

// Schema, Index & Explain Plan Routes
router.get('/schema/:dbName/:collectionName/infer', inferSchema);
router.get('/indexes/:dbName/:collectionName', listIndexes);
router.post('/indexes/:dbName/:collectionName/create', createIndex);
router.delete('/indexes/:dbName/:collectionName/:indexName', dropIndex);
router.post('/documents/:dbName/:collectionName/explain', explainQuery);

// AI Query Assistant Routes
router.post('/ai/generate', generateQuery);
router.post('/ai/explain', aiExplainQuery);

export default router;
