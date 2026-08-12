"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.explainQuery = exports.dropIndex = exports.createIndex = exports.listIndexes = exports.inferSchema = void 0;
const mongoManager_js_1 = require("../services/mongoManager.js");
const mongoManager = mongoManager_js_1.MongoConnectionManager.getInstance();
const inferSchema = async (req, res) => {
    try {
        const connectionUri = req.headers['x-mongo-uri'] || req.body.connectionUri;
        const { dbName, collectionName } = req.params;
        const sampleSize = req.query.sampleSize ? Number(req.query.sampleSize) : 100;
        if (!connectionUri || !dbName || !collectionName) {
            res.status(400).json({ success: false, error: 'connectionUri, dbName, and collectionName are required' });
            return;
        }
        const result = await mongoManager.inferSchema(connectionUri, dbName, collectionName, sampleSize);
        res.json({ success: true, ...result });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
exports.inferSchema = inferSchema;
const listIndexes = async (req, res) => {
    try {
        const connectionUri = req.headers['x-mongo-uri'] || req.body.connectionUri;
        const { dbName, collectionName } = req.params;
        if (!connectionUri || !dbName || !collectionName) {
            res.status(400).json({ success: false, error: 'connectionUri, dbName, and collectionName are required' });
            return;
        }
        const indexes = await mongoManager.listIndexes(connectionUri, dbName, collectionName);
        res.json({ success: true, indexes });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
exports.listIndexes = listIndexes;
const createIndex = async (req, res) => {
    try {
        const connectionUri = req.headers['x-mongo-uri'] || req.body.connectionUri;
        const { dbName, collectionName } = req.params;
        const { fieldSpecs, isUnique } = req.body;
        if (!connectionUri || !dbName || !collectionName || !fieldSpecs) {
            res.status(400).json({ success: false, error: 'fieldSpecs required' });
            return;
        }
        const name = await mongoManager.createIndex(connectionUri, dbName, collectionName, fieldSpecs, !!isUnique);
        res.json({ success: true, indexName: name });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
exports.createIndex = createIndex;
const dropIndex = async (req, res) => {
    try {
        const connectionUri = req.headers['x-mongo-uri'] || req.body.connectionUri;
        const { dbName, collectionName, indexName } = req.params;
        if (!connectionUri || !dbName || !collectionName || !indexName) {
            res.status(400).json({ success: false, error: 'indexName required' });
            return;
        }
        await mongoManager.dropIndex(connectionUri, dbName, collectionName, indexName);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
exports.dropIndex = dropIndex;
const explainQuery = async (req, res) => {
    try {
        const connectionUri = req.headers['x-mongo-uri'] || req.body.connectionUri;
        const { dbName, collectionName } = req.params;
        const { filter } = req.body;
        const explainPlan = await mongoManager.getExplainPlan(connectionUri, dbName, collectionName, filter || {});
        res.json({ success: true, explainPlan });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
exports.explainQuery = explainQuery;
