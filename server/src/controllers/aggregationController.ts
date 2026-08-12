import { Request, Response } from 'express';
import { MongoConnectionManager } from '../services/mongoManager.js';

const mongoManager = MongoConnectionManager.getInstance();

export const executeAggregation = async (req: Request, res: Response): Promise<void> => {
  try {
    const connectionUri = (req.headers['x-mongo-uri'] as string) || req.body.connectionUri;
    const { dbName, collectionName } = req.params;
    const { pipeline } = req.body;

    if (!connectionUri || !dbName || !collectionName || !Array.isArray(pipeline)) {
      res.status(400).json({ success: false, error: 'connectionUri, dbName, collectionName, and pipeline array are required' });
      return;
    }

    const result = await mongoManager.executeAggregation(connectionUri, dbName, collectionName, pipeline);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
