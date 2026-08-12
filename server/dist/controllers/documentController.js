"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDocument = exports.updateDocument = exports.insertDocument = exports.queryDocuments = void 0;
const mongoManager_js_1 = require("../services/mongoManager.js");
const mongoManager = mongoManager_js_1.MongoConnectionManager.getInstance();
const queryDocuments = async (req, res) => {
    try {
        const connectionUri = req.headers['x-mongo-uri'] || req.body.connectionUri;
        const { dbName, collectionName } = req.params;
        const { filter, projection, sort, limit, skip } = req.body;
        if (!connectionUri || !dbName || !collectionName) {
            res.status(400).json({ success: false, error: 'connectionUri, dbName, and collectionName are required' });
            return;
        }
        const result = await mongoManager.queryDocuments(connectionUri, dbName, collectionName, {
            filter,
            projection,
            sort,
            limit: limit ? Number(limit) : 50,
            skip: skip ? Number(skip) : 0
        });
        res.json({ success: true, ...result });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
exports.queryDocuments = queryDocuments;
const insertDocument = async (req, res) => {
    try {
        const connectionUri = req.headers['x-mongo-uri'] || req.body.connectionUri;
        const { dbName, collectionName } = req.params;
        const { document } = req.body;
        if (!connectionUri || !dbName || !collectionName || !document) {
            res.status(400).json({ success: false, error: 'connectionUri, dbName, collectionName, and document are required' });
            return;
        }
        const result = await mongoManager.insertDocuments(connectionUri, dbName, collectionName, document);
        res.json({ success: true, ...result });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
exports.insertDocument = insertDocument;
const updateDocument = async (req, res) => {
    try {
        const connectionUri = req.headers['x-mongo-uri'] || req.body.connectionUri;
        const { dbName, collectionName } = req.params;
        const { filter, update } = req.body;
        if (!connectionUri || !dbName || !collectionName || !filter || !update) {
            res.status(400).json({ success: false, error: 'connectionUri, dbName, collectionName, filter, and update are required' });
            return;
        }
        const result = await mongoManager.updateDocument(connectionUri, dbName, collectionName, filter, update);
        res.json({ success: true, ...result });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
exports.updateDocument = updateDocument;
const deleteDocument = async (req, res) => {
    try {
        const connectionUri = req.headers['x-mongo-uri'] || req.body.connectionUri;
        const { dbName, collectionName } = req.params;
        const { filter } = req.body;
        if (!connectionUri || !dbName || !collectionName || !filter) {
            res.status(400).json({ success: false, error: 'connectionUri, dbName, collectionName, and filter are required' });
            return;
        }
        const result = await mongoManager.deleteDocument(connectionUri, dbName, collectionName, filter);
        res.json({ success: true, ...result });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
exports.deleteDocument = deleteDocument;
