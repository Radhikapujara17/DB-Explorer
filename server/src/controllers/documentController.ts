import { Request, Response } from 'express';
import { MongoConnectionManager } from '../services/mongoManager.js';

const mongoManager = MongoConnectionManager.getInstance();

export const queryDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const connectionUri = (req.headers['x-mongo-uri'] as string) || req.body.connectionUri;
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
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const insertDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const connectionUri = (req.headers['x-mongo-uri'] as string) || req.body.connectionUri;
    const { dbName, collectionName } = req.params;
    const { document } = req.body;

    if (!connectionUri || !dbName || !collectionName || !document) {
      res.status(400).json({ success: false, error: 'connectionUri, dbName, collectionName, and document are required' });
      return;
    }

    const result = await mongoManager.insertDocuments(connectionUri, dbName, collectionName, document);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const connectionUri = (req.headers['x-mongo-uri'] as string) || req.body.connectionUri;
    const { dbName, collectionName } = req.params;
    const { filter, update } = req.body;

    if (!connectionUri || !dbName || !collectionName || !filter || !update) {
      res.status(400).json({ success: false, error: 'connectionUri, dbName, collectionName, filter, and update are required' });
      return;
    }

    const result = await mongoManager.updateDocument(connectionUri, dbName, collectionName, filter, update);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const connectionUri = (req.headers['x-mongo-uri'] as string) || req.body.connectionUri;
    const { dbName, collectionName } = req.params;
    const { filter } = req.body;

    if (!connectionUri || !dbName || !collectionName || !filter) {
      res.status(400).json({ success: false, error: 'connectionUri, dbName, collectionName, and filter are required' });
      return;
    }

    const result = await mongoManager.deleteDocument(connectionUri, dbName, collectionName, filter);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
