import { MongoClient, Document, ObjectId } from 'mongodb';
import { parseEJSON, serializeEJSON } from '../utils/ejson.js';

export interface FieldInfo {
  name: string;
  types: string[];
  sampleValue: any;
  presencePercentage: number;
}

export interface CollectionStats {
  name: string;
  count: number;
  size: number;
  avgObjSize: number;
  storageSize: number;
  indexesCount: number;
  totalIndexSize: number;
}

export interface DatabaseStats {
  name: string;
  collectionsCount: number;
  dataSize: number;
  storageSize: number;
  indexesCount: number;
  objectsCount: number;
}

export class MongoConnectionManager {
  private static instance: MongoConnectionManager;
  private clients: Map<string, MongoClient> = new Map();

  private constructor() {}

  public static getInstance(): MongoConnectionManager {
    if (!MongoConnectionManager.instance) {
      MongoConnectionManager.instance = new MongoConnectionManager();
    }
    return MongoConnectionManager.instance;
  }

  public async getClient(connectionUri: string): Promise<MongoClient> {
    if (this.clients.has(connectionUri)) {
      const existing = this.clients.get(connectionUri)!;
      try {
        await existing.db('admin').command({ ping: 1 });
        return existing;
      } catch {
        try { await existing.close(); } catch {}
        this.clients.delete(connectionUri);
      }
    }

    const client = new MongoClient(connectionUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    await client.connect();
    this.clients.set(connectionUri, client);
    return client;
  }

  public async testConnection(connectionUri: string): Promise<{ success: boolean; latencyMs: number; error?: string }> {
    const startTime = Date.now();
    try {
      const client = new MongoClient(connectionUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      await client.connect();
      await client.db('admin').command({ ping: 1 });
      const latencyMs = Date.now() - startTime;
      await client.close();
      return { success: true, latencyMs };
    } catch (err: any) {
      return { success: false, latencyMs: Date.now() - startTime, error: err.message || 'Failed to connect' };
    }
  }

  public async disconnect(connectionUri?: string): Promise<void> {
    if (connectionUri) {
      const client = this.clients.get(connectionUri);
      if (client) {
        await client.close();
        this.clients.delete(connectionUri);
      }
    } else {
      for (const [uri, client] of this.clients.entries()) {
        try { await client.close(); } catch {}
      }
      this.clients.clear();
    }
  }

  public async listDatabases(connectionUri: string): Promise<DatabaseStats[]> {
    const client = await this.getClient(connectionUri);
    const adminDb = client.db('admin');
    const dbsResult = await adminDb.admin().listDatabases();

    const dbStatsList: DatabaseStats[] = [];

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
      } catch (err) {
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

  public async listCollections(connectionUri: string, dbName: string): Promise<CollectionStats[]> {
    const client = await this.getClient(connectionUri);
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();

    const result: CollectionStats[] = [];

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
        let stats: any = {};
        try {
          stats = await db.command({ collStats: col.name });
        } catch {}

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
      } catch (err) {
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

  public async createCollection(connectionUri: string, dbName: string, collectionName: string): Promise<boolean> {
    const client = await this.getClient(connectionUri);
    const db = client.db(dbName);
    await db.createCollection(collectionName);
    return true;
  }

  public async dropCollection(connectionUri: string, dbName: string, collectionName: string): Promise<boolean> {
    const client = await this.getClient(connectionUri);
    const db = client.db(dbName);
    return await db.collection(collectionName).drop();
  }

  public async queryDocuments(
    connectionUri: string,
    dbName: string,
    collectionName: string,
    options: {
      filter?: any;
      projection?: any;
      sort?: any;
      limit?: number;
      skip?: number;
    }
  ): Promise<{ documents: any[]; totalCount: number; executionTimeMs: number }> {
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
    if (Object.keys(sort).length > 0) cursor = cursor.sort(sort);
    if (skip > 0) cursor = cursor.skip(skip);
    if (limit > 0) cursor = cursor.limit(limit);

    const docs = await cursor.toArray();
    const executionTimeMs = Date.now() - startTime;

    return {
      documents: docs.map(d => serializeEJSON(d)),
      totalCount,
      executionTimeMs
    };
  }

  public async insertDocuments(
    connectionUri: string,
    dbName: string,
    collectionName: string,
    data: any
  ): Promise<{ insertedCount: number; insertedIds: any }> {
    const client = await this.getClient(connectionUri);
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const parsedData = parseEJSON(typeof data === 'string' ? data : JSON.stringify(data));

    if (Array.isArray(parsedData)) {
      const res = await collection.insertMany(parsedData);
      return { insertedCount: res.insertedCount, insertedIds: serializeEJSON(res.insertedIds) };
    } else {
      const res = await collection.insertOne(parsedData);
      return { insertedCount: 1, insertedIds: serializeEJSON(res.insertedId) };
    }
  }

  public async updateDocument(
    connectionUri: string,
    dbName: string,
    collectionName: string,
    filter: any,
    update: any
  ): Promise<{ modifiedCount: number; matchedCount: number }> {
    const client = await this.getClient(connectionUri);
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const parsedFilter = parseEJSON(typeof filter === 'string' ? filter : JSON.stringify(filter));
    const parsedUpdate = parseEJSON(typeof update === 'string' ? update : JSON.stringify(update));

    const updateQuery = Object.keys(parsedUpdate).some(k => k.startsWith('$'))
      ? parsedUpdate
      : { $set: parsedUpdate };

    const res = await collection.updateOne(parsedFilter, updateQuery);
    return { modifiedCount: res.modifiedCount, matchedCount: res.matchedCount };
  }

  public async deleteDocument(
    connectionUri: string,
    dbName: string,
    collectionName: string,
    filter: any
  ): Promise<{ deletedCount: number }> {
    const client = await this.getClient(connectionUri);
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const parsedFilter = parseEJSON(typeof filter === 'string' ? filter : JSON.stringify(filter));
    const res = await collection.deleteOne(parsedFilter);
    return { deletedCount: res.deletedCount };
  }

  public async executeAggregation(
    connectionUri: string,
    dbName: string,
    collectionName: string,
    pipeline: any[]
  ): Promise<{
    stagePreviews: { stageIndex: number; stageName: string; stageQuery: any; count: number; sampleDocs: any[] }[];
    finalResult: any[];
    executionTimeMs: number;
  }> {
    const startTime = Date.now();
    const client = await this.getClient(connectionUri);
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const parsedPipeline = parseEJSON(typeof pipeline === 'string' ? pipeline : JSON.stringify(pipeline));

    const stagePreviews: { stageIndex: number; stageName: string; stageQuery: any; count: number; sampleDocs: any[] }[] = [];

    for (let i = 0; i < parsedPipeline.length; i++) {
      const subPipeline = parsedPipeline.slice(0, i + 1);
      const stageObj = parsedPipeline[i];
      const stageName = Object.keys(stageObj)[0] || `$stage_${i}`;

      try {
        const previewDocs = await collection.aggregate([...subPipeline, { $limit: 10 }]).toArray();
        stagePreviews.push({
          stageIndex: i,
          stageName,
          stageQuery: serializeEJSON(stageObj),
          count: previewDocs.length,
          sampleDocs: previewDocs.map(d => serializeEJSON(d))
        });
      } catch (err: any) {
        stagePreviews.push({
          stageIndex: i,
          stageName,
          stageQuery: serializeEJSON(stageObj),
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
      finalResult: finalDocs.map(d => serializeEJSON(d)),
      executionTimeMs
    };
  }

  public async inferSchema(
    connectionUri: string,
    dbName: string,
    collectionName: string,
    sampleSize = 100
  ): Promise<{ fields: FieldInfo[]; totalSampled: number }> {
    const client = await this.getClient(connectionUri);
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const sampleDocs = await collection.find({}).limit(sampleSize).toArray();
    const fieldMap: Map<string, { types: Set<string>; sampleValue: any; count: number }> = new Map();

    const traverseObject = (obj: any, prefix = '') => {
      if (!obj || typeof obj !== 'object') return;

      for (const key of Object.keys(obj)) {
        const val = obj[key];
        const fieldName = prefix ? `${prefix}.${key}` : key;
        let typeName: string = typeof val;

        if (val === null) typeName = 'null';
        else if (Array.isArray(val)) typeName = 'Array';
        else if (val instanceof ObjectId) typeName = 'ObjectId';
        else if (val instanceof Date) typeName = 'Date';
        else if (val && typeof val === 'object' && val._bsontype) typeName = val._bsontype;
        else if (typeName === 'object') typeName = 'Object';

        if (!fieldMap.has(fieldName)) {
          fieldMap.set(fieldName, {
            types: new Set([typeName]),
            sampleValue: serializeEJSON(val),
            count: 1
          });
        } else {
          const entry = fieldMap.get(fieldName)!;
          entry.types.add(typeName);
          entry.count += 1;
        }

        if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof ObjectId) && !(val instanceof Date)) {
          traverseObject(val, fieldName);
        }
      }
    };

    sampleDocs.forEach(doc => traverseObject(doc));

    const fields: FieldInfo[] = [];
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

  public async listIndexes(connectionUri: string, dbName: string, collectionName: string): Promise<any[]> {
    const client = await this.getClient(connectionUri);
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    const indexes = await collection.indexes();
    return indexes.map(idx => serializeEJSON(idx));
  }

  public async createIndex(connectionUri: string, dbName: string, collectionName: string, fieldSpecs: Record<string, number | string>, isUnique: boolean): Promise<string> {
    const client = await this.getClient(connectionUri);
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    return await collection.createIndex(fieldSpecs as any, { unique: isUnique });
  }

  public async dropIndex(connectionUri: string, dbName: string, collectionName: string, indexName: string): Promise<boolean> {
    const client = await this.getClient(connectionUri);
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    await collection.dropIndex(indexName);
    return true;
  }

  public async getExplainPlan(connectionUri: string, dbName: string, collectionName: string, filter: any): Promise<any> {
    const client = await this.getClient(connectionUri);
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    const parsedFilter = parseEJSON(typeof filter === 'string' ? filter : JSON.stringify(filter));
    const explainDoc = await collection.find(parsedFilter).explain('executionStats');
    return serializeEJSON(explainDoc);
  }

  public async getServerStatus(connectionUri: string): Promise<any> {
    const client = await this.getClient(connectionUri);
    const adminDb = client.db('admin');
    const status = await adminDb.command({ serverStatus: 1 });
    return serializeEJSON({
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
