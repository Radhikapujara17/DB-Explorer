"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const mongodb_1 = require("mongodb");
const index_1 = __importDefault(require("./routes/index"));
const mongoManager_1 = require("./services/mongoManager");
let mongoServer;
let connectionUri;
let client;
let app;
beforeAll(async () => {
    mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
    connectionUri = mongoServer.getUri();
    client = new mongodb_1.MongoClient(connectionUri);
    await client.connect();
    // Create mock database and collection
    const db = client.db('testdb');
    const collection = db.collection('testcol');
    await collection.insertOne({ _id: new mongodb_1.ObjectId('5f1f1a6f8b10f85888364fa1'), name: 'Test Doc', value: 42 });
    app = (0, express_1.default)();
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use('/api', index_1.default);
});
afterAll(async () => {
    await mongoManager_1.MongoConnectionManager.getInstance().disconnect();
    if (client) {
        await client.close();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
});
describe('Document API Endpoints', () => {
    it('should query documents successfully', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/documents/testdb/testcol/query')
            .set('x-mongo-uri', connectionUri)
            .send({ filter: {}, limit: 10, skip: 0 });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.documents).toBeInstanceOf(Array);
        expect(res.body.documents.length).toBe(1);
        expect(res.body.documents[0].name).toBe('Test Doc');
    });
    it('should create a new document', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/documents/testdb/testcol/insert')
            .set('x-mongo-uri', connectionUri)
            .send({
            document: { name: 'New Doc', value: 100 }
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.insertedCount).toBe(1);
    });
    it('should delete a document', async () => {
        const res = await (0, supertest_1.default)(app)
            .delete('/api/documents/testdb/testcol/delete')
            .set('x-mongo-uri', connectionUri)
            .send({
            filter: { _id: { $oid: '5f1f1a6f8b10f85888364fa1' } }
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.deletedCount).toBe(1);
    });
});
