"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeAggregation = void 0;
const mongoManager_js_1 = require("../services/mongoManager.js");
const mongoManager = mongoManager_js_1.MongoConnectionManager.getInstance();
const executeAggregation = async (req, res) => {
    try {
        const connectionUri = req.headers['x-mongo-uri'] || req.body.connectionUri;
        const { dbName, collectionName } = req.params;
        const { pipeline } = req.body;
        if (!connectionUri || !dbName || !collectionName || !Array.isArray(pipeline)) {
            res.status(400).json({ success: false, error: 'connectionUri, dbName, collectionName, and pipeline array are required' });
            return;
        }
        const result = await mongoManager.executeAggregation(connectionUri, dbName, collectionName, pipeline);
        res.json({ success: true, ...result });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
exports.executeAggregation = executeAggregation;
