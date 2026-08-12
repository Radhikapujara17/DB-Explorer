import express from 'express';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, ObjectId } from 'mongodb';
import router from './routes/index';
import { MongoConnectionManager } from './services/mongoManager';

let mongoServer: MongoMemoryServer;
let connectionUri: string;
let client: MongoClient;
let app: express.Express;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  connectionUri = mongoServer.getUri();
  
  client = new MongoClient(connectionUri);
  await client.connect();

  // Create mock database and collection
  const db = client.db('testdb');
  const collection = db.collection('testcol');
  await collection.insertOne({ _id: new ObjectId('5f1f1a6f8b10f85888364fa1'), name: 'Test Doc', value: 42 });

  app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use('/api', router);
});

afterAll(async () => {
  await MongoConnectionManager.getInstance().disconnect();
  if (client) {
    await client.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('Document API Endpoints', () => {
  it('should query documents successfully', async () => {
    const res = await request(app)
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
    const res = await request(app)
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
    const res = await request(app)
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
