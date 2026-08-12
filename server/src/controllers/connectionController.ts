import { Request, Response } from 'express';
import { MongoConnectionManager } from '../services/mongoManager.js';

const mongoManager = MongoConnectionManager.getInstance();

export const testConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { connectionUri } = req.body;
    if (!connectionUri) {
      res.status(400).json({ success: false, error: 'connectionUri is required' });
      return;
    }
    const result = await mongoManager.testConnection(connectionUri);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getDatabases = async (req: Request, res: Response): Promise<void> => {
  try {
    const connectionUri = (req.headers['x-mongo-uri'] as string) || req.body.connectionUri;
    if (!connectionUri) {
      res.status(400).json({ success: false, error: 'x-mongo-uri header or connectionUri body required' });
      return;
    }
    const dbs = await mongoManager.listDatabases(connectionUri);
    res.json({ success: true, databases: dbs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getCollections = async (req: Request, res: Response): Promise<void> => {
  try {
    const connectionUri = (req.headers['x-mongo-uri'] as string) || req.body.connectionUri;
    const { dbName } = req.params;
    if (!connectionUri || !dbName) {
      res.status(400).json({ success: false, error: 'connectionUri and dbName are required' });
      return;
    }
    const collections = await mongoManager.listCollections(connectionUri, dbName);
    res.json({ success: true, dbName, collections });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const connectionUri = (req.headers['x-mongo-uri'] as string) || req.body.connectionUri;
    const { dbName } = req.params;
    const { collectionName } = req.body;

    if (!connectionUri || !dbName || !collectionName) {
      res.status(400).json({ success: false, error: 'collectionName is required' });
      return;
    }

    await mongoManager.createCollection(connectionUri, dbName, collectionName);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const dropCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const connectionUri = (req.headers['x-mongo-uri'] as string) || req.body.connectionUri;
    const { dbName, collectionName } = req.params;

    if (!connectionUri || !dbName || !collectionName) {
      res.status(400).json({ success: false, error: 'dbName and collectionName required' });
      return;
    }

    await mongoManager.dropCollection(connectionUri, dbName, collectionName);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getServerStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const connectionUri = (req.headers['x-mongo-uri'] as string) || req.body.connectionUri;
    if (!connectionUri) {
      res.status(400).json({ success: false, error: 'connectionUri required' });
      return;
    }

    const status = await mongoManager.getServerStatus(connectionUri);
    res.json({ success: true, serverStatus: status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
