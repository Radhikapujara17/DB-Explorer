import express from 'express';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, ObjectId } from 'mongodb';
import router from './routes/index';
import { MongoConnectionManager } from './services/mongoManager';

let mongoServer: MongoMemoryServer | null = null;
let connectionUri: string;
let client: MongoClient;
let app: express.Express;

jest.setTimeout(30000);

beforeAll(async () => {
  const localUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
  try {
    const testClient = new MongoClient(localUri, { serverSelectionTimeoutMS: 2000 });
    await testClient.connect();
    client = testClient;
    connectionUri = localUri;
  } catch {
    mongoServer = await MongoMemoryServer.create();
    connectionUri = mongoServer.getUri();
    client = new MongoClient(connectionUri);
    await client.connect();
  }

  // Create mock database and collection
  const db = client.db('testdb_jest_tmp');
  const collection = db.collection('testcol');
  await collection.deleteMany({});
  await collection.insertOne({ _id: new ObjectId('5f1f1a6f8b10f85888364fa1'), name: 'Test Doc', value: 42 });

  app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use('/api', router);
});

afterAll(async () => {
  await MongoConnectionManager.getInstance().disconnect();
  if (client) {
    try {
      await client.db('testdb_jest_tmp').dropDatabase();
    } catch {}
    await client.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('Document API Endpoints', () => {
  it('should query documents successfully', async () => {
    const res = await request(app)
      .post('/api/documents/testdb_jest_tmp/testcol/query')
      .set('x-mongo-uri', connectionUri)
      .send({ filter: {}, limit: 10, skip: 0 });
      
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.documents).toBeInstanceOf(Array);
    expect(res.body.documents.length).toBe(1);
    expect(res.body.documents[0].name).toBe('Test Doc');
  });

  it('should update a document without immutable _id error', async () => {
    const res = await request(app)
      .put('/api/documents/testdb_jest_tmp/testcol/update')
      .set('x-mongo-uri', connectionUri)
      .send({
        filter: { _id: '5f1f1a6f8b10f85888364fa1' },
        update: {
          $set: {
            _id: '5f1f1a6f8b10f85888364fa1',
            name: 'Updated Doc Name',
            value: 99
          }
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.modifiedCount).toBe(1);
  });

  it('should update a document using direct document replacement', async () => {
    const res = await request(app)
      .put('/api/documents/testdb_jest_tmp/testcol/update')
      .set('x-mongo-uri', connectionUri)
      .send({
        filter: { _id: { $oid: '5f1f1a6f8b10f85888364fa1' } },
        update: {
          _id: { $oid: '5f1f1a6f8b10f85888364fa1' },
          name: 'Replaced Doc Name',
          value: 123,
          newField: 'Added via edit'
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.modifiedCount).toBe(1);

    // Verify document was actually updated
    const checkRes = await request(app)
      .post('/api/documents/testdb_jest_tmp/testcol/query')
      .set('x-mongo-uri', connectionUri)
      .send({ filter: { _id: { $oid: '5f1f1a6f8b10f85888364fa1' } } });

    expect(checkRes.status).toBe(200);
    expect(checkRes.body.documents[0].name).toBe('Replaced Doc Name');
    expect(checkRes.body.documents[0].newField).toBe('Added via edit');
  });

  it('should create a new document', async () => {
    const res = await request(app)
      .post('/api/documents/testdb_jest_tmp/testcol/insert')
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
      .delete('/api/documents/testdb_jest_tmp/testcol/delete')
      .set('x-mongo-uri', connectionUri)
      .send({
        filter: { _id: { $oid: '5f1f1a6f8b10f85888364fa1' } }
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.deletedCount).toBe(1);
  });
});
