"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoConnectionManager = void 0;
const mongodb_1 = require("mongodb");
const ejson_js_1 = require("../utils/ejson.js");
class MongoConnectionManager {
    static instance;
    clients = new Map();
    constructor() { }
    static getInstance() {
        if (!MongoConnectionManager.instance) {
            MongoConnectionManager.instance = new MongoConnectionManager();
        }
        return MongoConnectionManager.instance;
    }
    async getClient(connectionUri) {
        if (this.clients.has(connectionUri)) {
            const existing = this.clients.get(connectionUri);
            try {
                await existing.db('admin').command({ ping: 1 });
                return existing;
            }
            catch {
                try {
                    await existing.close();
                }
                catch { }
                this.clients.delete(connectionUri);
            }
        }
        const client = new mongodb_1.MongoClient(connectionUri, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
        });
        await client.connect();
        this.clients.set(connectionUri, client);
        return client;
    }
    async testConnection(connectionUri) {
        const startTime = Date.now();
        try {
            const client = new mongodb_1.MongoClient(connectionUri, {
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 5000,
            });
            await client.connect();
            await client.db('admin').command({ ping: 1 });
            const latencyMs = Date.now() - startTime;
            await client.close();
            return { success: true, latencyMs };
        }
        catch (err) {
            return { success: false, latencyMs: Date.now() - startTime, error: err.message || 'Failed to connect' };
        }
    }
    async disconnect(connectionUri) {
        if (connectionUri) {
            const client = this.clients.get(connectionUri);
            if (client) {
                await client.close();
                this.clients.delete(connectionUri);
            }
        }
        else {
            for (const [uri, client] of this.clients.entries()) {
                try {
                    await client.close();
                }
                catch { }
            }
            this.clients.clear();
        }
    }
    async listDatabases(connectionUri) {
        const client = await this.getClient(connectionUri);
        const adminDb = client.db('admin');
        const dbsResult = await adminDb.admin().listDatabases();
        const dbStatsList = [];
        for (const dbInfo of dbsResult.databases) {
            try {
                const db = client.db(dbInfo.name);
                const stats = await db.stats();
                dbStatsList.push({
                    name: dbInfo.name,
                    collectionsCount: stats.collections || 0,
                    dataSize: stats.dataSize || dbInfo.sizeOnDisk || 0,
                    storageSize: stats.storageSize || 0,
                    indexesCount: stats.indexes || 0,
                    objectsCount: stats.objects || 0
                });
            }
            catch (err) {
                dbStatsList.push({
                    name: dbInfo.name,
                    collectionsCount: 0,
                    dataSize: dbInfo.sizeOnDisk || 0,
                    storageSize: 0,
                    indexesCount: 0,
                    objectsCount: 0
                });
            }
        }
        return dbStatsList;
    }
    async listCollections(connectionUri, dbName) {
        const client = await this.getClient(connectionUri);
        const db = client.db(dbName);
        const collections = await db.listCollections().toArray();
        const result = [];
        for (const col of collections) {
            if (col.type === 'view') {
                result.push({
                    name: col.name,
                    count: 0,
                    size: 0,
                    avgObjSize: 0,
                    storageSize: 0,
                    indexesCount: 0,
                    totalIndexSize: 0
                });
                continue;
            }
            try {
                const collInstance = db.collection(col.name);
                const count = await collInstance.estimatedDocumentCount();
                let stats = {};
                try {
                    stats = await db.command({ collStats: col.name });
                }
                catch { }
                const indexes = await collInstance.indexes();
                result.push({
                    name: col.name,
                    count: count || stats.count || 0,
                    size: stats.size || 0,
                    avgObjSize: stats.avgObjSize || 0,
                    storageSize: stats.storageSize || 0,
                    indexesCount: indexes.length,
                    totalIndexSize: stats.totalIndexSize || 0
                });
            }
            catch (err) {
                result.push({
                    name: col.name,
                    count: 0,
                    size: 0,
                    avgObjSize: 0,
                    storageSize: 0,
                    indexesCount: 0,
                    totalIndexSize: 0
                });
            }
        }
        return result.sort((a, b) => a.name.localeCompare(b.name));
    }
    async createCollection(connectionUri, dbName, collectionName) {
        const client = await this.getClient(connectionUri);
        const db = client.db(dbName);
        await db.createCollection(collectionName);
        return true;
    }
    async dropCollection(connectionUri, dbName, collectionName) {
        const client = await this.getClient(connectionUri);
        const db = client.db(dbName);
        return await db.collection(collectionName).drop();
    }
    async queryDocuments(connectionUri, dbName, collectionName, options) {
        const startTime = Date.now();
        const client = await this.getClient(connectionUri);
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        const filter = options.filter || {};
        const projection = options.projection || {};
        const sort = options.sort || {};
        const limit = options.limit ?? 50;
        const skip = options.skip ?? 0;
        const totalCount = await collection.countDocuments(filter);
        let cursor = collection.find(filter, { projection });
        if (Object.keys(sort).length > 0)
            cursor = cursor.sort(sort);
        if (skip > 0)
            cursor = cursor.skip(skip);
        if (limit > 0)
            cursor = cursor.limit(limit);
        const docs = await cursor.toArray();
        const executionTimeMs = Date.now() - startTime;
        return {
            documents: docs.map(d => (0, ejson_js_1.serializeEJSON)(d)),
            totalCount,
            executionTimeMs
        };
    }
    async insertDocuments(connectionUri, dbName, collectionName, data) {
        const client = await this.getClient(connectionUri);
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        const parsedData = (0, ejson_js_1.parseEJSON)(typeof data === 'string' ? data : JSON.stringify(data));
        if (Array.isArray(parsedData)) {
            const res = await collection.insertMany(parsedData);
            return { insertedCount: res.insertedCount, insertedIds: (0, ejson_js_1.serializeEJSON)(res.insertedIds) };
        }
        else {
            const res = await collection.insertOne(parsedData);
            return { insertedCount: 1, insertedIds: (0, ejson_js_1.serializeEJSON)(res.insertedId) };
        }
    }
    async updateDocument(connectionUri, dbName, collectionName, filter, update) {
        const client = await this.getClient(connectionUri);
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        const parsedFilter = (0, ejson_js_1.parseEJSON)(typeof filter === 'string' ? filter : JSON.stringify(filter));
        const parsedUpdate = (0, ejson_js_1.parseEJSON)(typeof update === 'string' ? update : JSON.stringify(update));
        const updateQuery = Object.keys(parsedUpdate).some(k => k.startsWith('$'))
            ? parsedUpdate
            : { $set: parsedUpdate };
        const res = await collection.updateOne(parsedFilter, updateQuery);
        return { modifiedCount: res.modifiedCount, matchedCount: res.matchedCount };
    }
    async deleteDocument(connectionUri, dbName, collectionName, filter) {
        const client = await this.getClient(connectionUri);
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        const parsedFilter = (0, ejson_js_1.parseEJSON)(typeof filter === 'string' ? filter : JSON.stringify(filter));
        const res = await collection.deleteOne(parsedFilter);
        return { deletedCount: res.deletedCount };
    }
    async executeAggregation(connectionUri, dbName, collectionName, pipeline) {
        const startTime = Date.now();
        const client = await this.getClient(connectionUri);
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        const parsedPipeline = (0, ejson_js_1.parseEJSON)(typeof pipeline === 'string' ? pipeline : JSON.stringify(pipeline));
        const stagePreviews = [];
        for (let i = 0; i < parsedPipeline.length; i++) {
            const subPipeline = parsedPipeline.slice(0, i + 1);
            const stageObj = parsedPipeline[i];
            const stageName = Object.keys(stageObj)[0] || `$stage_${i}`;
            try {
                const previewDocs = await collection.aggregate([...subPipeline, { $limit: 10 }]).toArray();
                stagePreviews.push({
                    stageIndex: i,
                    stageName,
                    stageQuery: (0, ejson_js_1.serializeEJSON)(stageObj),
                    count: previewDocs.length,
                    sampleDocs: previewDocs.map(d => (0, ejson_js_1.serializeEJSON)(d))
                });
            }
            catch (err) {
                stagePreviews.push({
                    stageIndex: i,
                    stageName,
                    stageQuery: (0, ejson_js_1.serializeEJSON)(stageObj),
                    count: 0,
                    sampleDocs: [{ error: `Stage ${i + 1} (${stageName}) error: ${err.message}` }]
                });
                break;
            }
        }
        const finalDocs = await collection.aggregate(parsedPipeline).toArray();
        const executionTimeMs = Date.now() - startTime;
        return {
            stagePreviews,
            finalResult: finalDocs.map(d => (0, ejson_js_1.serializeEJSON)(d)),
            executionTimeMs
        };
    }
    async inferSchema(connectionUri, dbName, collectionName, sampleSize = 100) {
        const client = await this.getClient(connectionUri);
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        const sampleDocs = await collection.find({}).limit(sampleSize).toArray();
        const fieldMap = new Map();
        const traverseObject = (obj, prefix = '') => {
            if (!obj || typeof obj !== 'object')
                return;
            for (const key of Object.keys(obj)) {
                const val = obj[key];
                const fieldName = prefix ? `${prefix}.${key}` : key;
                let typeName = typeof val;
                if (val === null)
                    typeName = 'null';
                else if (Array.isArray(val))
                    typeName = 'Array';
                else if (val instanceof mongodb_1.ObjectId)
                    typeName = 'ObjectId';
                else if (val instanceof Date)
                    typeName = 'Date';
                else if (val && typeof val === 'object' && val._bsontype)
                    typeName = val._bsontype;
                else if (typeName === 'object')
                    typeName = 'Object';
                if (!fieldMap.has(fieldName)) {
                    fieldMap.set(fieldName, {
                        types: new Set([typeName]),
                        sampleValue: (0, ejson_js_1.serializeEJSON)(val),
                        count: 1
                    });
                }
                else {
                    const entry = fieldMap.get(fieldName);
                    entry.types.add(typeName);
                    entry.count += 1;
                }
                if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof mongodb_1.ObjectId) && !(val instanceof Date)) {
                    traverseObject(val, fieldName);
                }
            }
        };
        sampleDocs.forEach(doc => traverseObject(doc));
        const fields = [];
        fieldMap.forEach((val, name) => {
            fields.push({
                name,
                types: Array.from(val.types),
                sampleValue: val.sampleValue,
                presencePercentage: Math.round((val.count / sampleDocs.length) * 100)
            });
        });
        return {
            fields: fields.sort((a, b) => a.name.localeCompare(b.name)),
            totalSampled: sampleDocs.length
        };
    }
    async listIndexes(connectionUri, dbName, collectionName) {
        const client = await this.getClient(connectionUri);
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        const indexes = await collection.indexes();
        return indexes.map(idx => (0, ejson_js_1.serializeEJSON)(idx));
    }
    async createIndex(connectionUri, dbName, collectionName, fieldSpecs, isUnique) {
        const client = await this.getClient(connectionUri);
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        return await collection.createIndex(fieldSpecs, { unique: isUnique });
    }
    async dropIndex(connectionUri, dbName, collectionName, indexName) {
        const client = await this.getClient(connectionUri);
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        await collection.dropIndex(indexName);
        return true;
    }
    async getExplainPlan(connectionUri, dbName, collectionName, filter) {
        const client = await this.getClient(connectionUri);
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        const parsedFilter = (0, ejson_js_1.parseEJSON)(typeof filter === 'string' ? filter : JSON.stringify(filter));
        const explainDoc = await collection.find(parsedFilter).explain('executionStats');
        return (0, ejson_js_1.serializeEJSON)(explainDoc);
    }
    async getServerStatus(connectionUri) {
        const client = await this.getClient(connectionUri);
        const adminDb = client.db('admin');
        const status = await adminDb.command({ serverStatus: 1 });
        return (0, ejson_js_1.serializeEJSON)({
            host: status.host,
            version: status.version,
            process: status.process,
            uptime: status.uptime,
            connections: status.connections,
            opcounters: status.opcounters,
            mem: status.mem
        });
    }
}
exports.MongoConnectionManager = MongoConnectionManager;
