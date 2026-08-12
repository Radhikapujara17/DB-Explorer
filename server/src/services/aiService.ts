import { GoogleGenAI } from '@google/genai';
import { CONFIG } from '../config/index.js';

export interface AIQueryResponse {
  type: 'find' | 'aggregate';
  filter?: Record<string, any>;
  projection?: Record<string, any>;
  sort?: Record<string, any>;
  pipeline?: Array<Record<string, any>>;
  explanation: string;
}

export class AIService {
  private static aiClient: GoogleGenAI | null = null;

  private static getClient(userApiKey?: string): GoogleGenAI {
    const key = userApiKey || CONFIG.GEMINI_API_KEY;
    if (!key) {
      throw new Error('Gemini API key is required. Please set GEMINI_API_KEY in environment or pass in request header/body.');
    }
    return new GoogleGenAI({ apiKey: key });
  }

  public static async generateQuery(
    prompt: string,
    schemaFields?: string[],
    collectionName?: string,
    userApiKey?: string
  ): Promise<AIQueryResponse> {
    const ai = this.getClient(userApiKey);
    const schemaContext = schemaFields ? `Schema fields available: ${schemaFields.join(', ')}.` : '';
    const collectionContext = collectionName ? `Target collection: ${collectionName}.` : '';

    const systemInstruction = `You are a MongoDB Query Expert AI Assistant. Convert user's natural language request into a MongoDB query or aggregation pipeline.
${collectionContext} ${schemaContext}

Output MUST be a raw JSON object with NO markdown formatting around it (or wrapped in standard JSON), matching this structure:
{
  "type": "find" | "aggregate",
  "filter": {}, // if type is 'find'
  "projection": {}, // if type is 'find'
  "sort": {}, // if type is 'find'
  "pipeline": [], // if type is 'aggregate'
  "explanation": "Clear plain English explanation of what this query does"
}
Ensure valid JSON output.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2
      }
    });

    const text = response.text || '';
    // Clean code fences if present
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      return JSON.parse(cleanedText) as AIQueryResponse;
    } catch (e) {
      return {
        type: 'find',
        filter: {},
        explanation: `Failed to parse AI output directly. Response: ${text}`
      };
    }
  }

  public static async explainQuery(
    queryOrPipeline: any,
    collectionName?: string,
    userApiKey?: string
  ): Promise<string> {
    const ai = this.getClient(userApiKey);
    const collectionContext = collectionName ? `Collection: ${collectionName}.` : '';

    const prompt = `Explain the following MongoDB query or aggregation pipeline in plain English for developers.
${collectionContext}
Query/Pipeline:
${JSON.stringify(queryOrPipeline, null, 2)}

Provide:
1. Overview of intent
2. Step-by-step breakdown of filter / aggregation stages
3. Performance implications & recommended indexes if applicable.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.3
      }
    });

    return response.text || 'No explanation generated.';
  }
}
