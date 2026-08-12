import { Request, Response } from 'express';
import { AIService } from '../services/aiService.js';

export const generateQuery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, schemaFields, collectionName, apiKey } = req.body;
    if (!prompt) {
      res.status(400).json({ success: false, error: 'prompt is required' });
      return;
    }

    const aiResult = await AIService.generateQuery(prompt, schemaFields, collectionName, apiKey);
    res.json({ success: true, query: aiResult });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const explainQuery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, collectionName, apiKey } = req.body;
    if (!query) {
      res.status(400).json({ success: false, error: 'query is required' });
      return;
    }

    const explanation = await AIService.explainQuery(query, collectionName, apiKey);
    res.json({ success: true, explanation });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
