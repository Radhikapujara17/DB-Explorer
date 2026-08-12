import { Request, Response } from 'express';
import { MongoConnectionManager } from '../services/mongoManager.js';

const mongoManager = MongoConnectionManager.getInstance();

export const inferSchema = async (req: Request, res: Response): Promise<void> => {
  try {
    const connectionUri = (req.headers['x-mongo-uri'] as string) || req.body.connectionUri;
    const { dbName, collectionName } = req.params;
    const sampleSize = req.query.sampleSize ? Number(req.query.sampleSize) : 100;

    if (!connectionUri || !dbName || !collectionName) {
      res.status(400).json({ success: false, error: 'connectionUri, dbName, and collectionName are required' });
      return;
    }

    const result = await mongoManager.inferSchema(connectionUri, dbName, collectionName, sampleSize);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const listIndexes = async (req: Request, res: Response): Promise<void> => {
  try {
    const connectionUri = (req.headers['x-mongo-uri'] as string) || req.body.connectionUri;
    const { dbName, collectionName } = req.params;

    if (!connectionUri || !dbName || !collectionName) {
      res.status(400).json({ success: false, error: 'connectionUri, dbName, and collectionName are required' });
      return;
    }

    const indexes = await mongoManager.listIndexes(connectionUri, dbName, collectionName);
    res.json({ success: true, indexes });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createIndex = async (req: Request, res: Response): Promise<void> => {
  try {
    const connectionUri = (req.headers['x-mongo-uri'] as string) || req.body.connectionUri;
    const { dbName, collectionName } = req.params;
    const { fieldSpecs, isUnique } = req.body;

    if (!connectionUri || !dbName || !collectionName || !fieldSpecs) {
      res.status(400).json({ success: false, error: 'fieldSpecs required' });
      return;
    }

    const name = await mongoManager.createIndex(connectionUri, dbName, collectionName, fieldSpecs, !!isUnique);
    res.json({ success: true, indexName: name });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const dropIndex = async (req: Request, res: Response): Promise<void> => {
  try {
    const connectionUri = (req.headers['x-mongo-uri'] as string) || req.body.connectionUri;
    const { dbName, collectionName, indexName } = req.params;

    if (!connectionUri || !dbName || !collectionName || !indexName) {
      res.status(400).json({ success: false, error: 'indexName required' });
      return;
    }

    await mongoManager.dropIndex(connectionUri, dbName, collectionName, indexName);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const explainQuery = async (req: Request, res: Response): Promise<void> => {
  try {
    const connectionUri = (req.headers['x-mongo-uri'] as string) || req.body.connectionUri;
    const { dbName, collectionName } = req.params;
    const { filter } = req.body;

    const explainPlan = await mongoManager.getExplainPlan(connectionUri, dbName, collectionName, filter || {});
    res.json({ success: true, explainPlan });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
