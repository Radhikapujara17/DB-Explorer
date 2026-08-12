"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.explainQuery = exports.generateQuery = void 0;
const aiService_js_1 = require("../services/aiService.js");
const generateQuery = async (req, res) => {
    try {
        const { prompt, schemaFields, collectionName, apiKey } = req.body;
        if (!prompt) {
            res.status(400).json({ success: false, error: 'prompt is required' });
            return;
        }
        const aiResult = await aiService_js_1.AIService.generateQuery(prompt, schemaFields, collectionName, apiKey);
        res.json({ success: true, query: aiResult });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
exports.generateQuery = generateQuery;
const explainQuery = async (req, res) => {
    try {
        const { query, collectionName, apiKey } = req.body;
        if (!query) {
            res.status(400).json({ success: false, error: 'query is required' });
            return;
        }
        const explanation = await aiService_js_1.AIService.explainQuery(query, collectionName, apiKey);
        res.json({ success: true, explanation });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
exports.explainQuery = explainQuery;
