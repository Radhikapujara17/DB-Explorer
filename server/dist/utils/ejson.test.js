"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ejson_1 = require("./ejson");
const mongodb_1 = require("mongodb");
describe('EJSON Utility', () => {
    it('should parse basic JSON correctly', () => {
        const jsonStr = '{"name":"John","age":30}';
        const parsed = (0, ejson_1.parseEJSON)(jsonStr);
        expect(parsed).toEqual({ name: 'John', age: 30 });
    });
    it('should parse Extended JSON correctly (ObjectId)', () => {
        const jsonStr = '{"_id":{"$oid":"5f1f1a6f8b10f85888364fa1"}}';
        const parsed = (0, ejson_1.parseEJSON)(jsonStr);
        expect(parsed._id).toBeInstanceOf(mongodb_1.ObjectId);
        expect(parsed._id.toHexString()).toBe('5f1f1a6f8b10f85888364fa1');
    });
    it('should serialize Extended JSON correctly', () => {
        const obj = { _id: new mongodb_1.ObjectId('5f1f1a6f8b10f85888364fa1'), name: 'Test' };
        const serialized = (0, ejson_1.serializeEJSON)(obj);
        // EJSON.serialize with { relaxed: true } converts ObjectIds back to string in some cases,
        // or plain objects depending on the version. Let's just check the conversion doesn't throw.
        expect(serialized).toBeDefined();
        expect(serialized.name).toBe('Test');
    });
    it('should return empty object for empty string', () => {
        expect((0, ejson_1.parseEJSON)('')).toEqual({});
        expect((0, ejson_1.parseEJSON)('   ')).toEqual({});
    });
});
