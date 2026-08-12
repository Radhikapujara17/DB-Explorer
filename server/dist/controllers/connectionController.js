"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServerStatus = exports.dropCollection = exports.createCollection = exports.getCollections = exports.getDatabases = exports.testConnection = void 0;
const mongoManager_js_1 = require("../services/mongoManager.js");
const mongoManager = mongoManager_js_1.MongoConnectionManager.getInstance();
const testConnection = async (req, res) => {
    try {
        const { connectionUri } = req.body;
        if (!connectionUri) {
            res.status(400).json({ success: false, error: 'connectionUri is required' });
            return;
        }
        const result = await mongoManager.testConnection(connectionUri);
        res.json(result);
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
exports.testConnection = testConnection;
const getDatabases = async (req, res) => {
    try {
        const connectionUri = req.headers['x-mongo-uri'] || req.body.connectionUri;
        if (!connectionUri) {
            res.status(400).json({ success: false, error: 'x-mongo-uri header or connectionUri body required' });
            return;
        }
        const dbs = await mongoManager.listDatabases(connectionUri);
        res.json({ success: true, databases: dbs });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
exports.getDatabases = getDatabases;
const getCollections = async (req, res) => {
    try {
        const connectionUri = req.headers['x-mongo-uri'] || req.body.connectionUri;
        const { dbName } = req.params;
        if (!connectionUri || !dbName) {
            res.status(400).json({ success: false, error: 'connectionUri and dbName are required' });
            return;
        }
        const collections = await mongoManager.listCollections(connectionUri, dbName);
        res.json({ success: true, dbName, collections });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
exports.getCollections = getCollections;
const createCollection = async (req, res) => {
    try {
        const connectionUri = req.headers['x-mongo-uri'] || req.body.connectionUri;
        const { dbName } = req.params;
        const { collectionName } = req.body;
        if (!connectionUri || !dbName || !collectionName) {
            res.status(400).json({ success: false, error: 'collectionName is required' });
            return;
        }
        await mongoManager.createCollection(connectionUri, dbName, collectionName);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
exports.createCollection = createCollection;
const dropCollection = async (req, res) => {
    try {
        const connectionUri = req.headers['x-mongo-uri'] || req.body.connectionUri;
        const { dbName, collectionName } = req.params;
        if (!connectionUri || !dbName || !collectionName) {
            res.status(400).json({ success: false, error: 'dbName and collectionName required' });
            return;
        }
        await mongoManager.dropCollection(connectionUri, dbName, collectionName);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
exports.dropCollection = dropCollection;
const getServerStatus = async (req, res) => {
    try {
        const connectionUri = req.headers['x-mongo-uri'] || req.body.connectionUri;
        if (!connectionUri) {
            res.status(400).json({ success: false, error: 'connectionUri required' });
            return;
        }
        const status = await mongoManager.getServerStatus(connectionUri);
        res.json({ success: true, serverStatus: status });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
exports.getServerStatus = getServerStatus;
