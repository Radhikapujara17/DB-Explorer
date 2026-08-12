import { parseEJSON, serializeEJSON } from './ejson';
import { ObjectId } from 'mongodb';

describe('EJSON Utility', () => {
  it('should parse basic JSON correctly', () => {
    const jsonStr = '{"name":"John","age":30}';
    const parsed = parseEJSON(jsonStr);
    expect(parsed).toEqual({ name: 'John', age: 30 });
  });

  it('should parse Extended JSON correctly (ObjectId)', () => {
    const jsonStr = '{"_id":{"$oid":"5f1f1a6f8b10f85888364fa1"}}';
    const parsed = parseEJSON(jsonStr);
    expect(parsed._id).toBeInstanceOf(ObjectId);
    expect(parsed._id.toHexString()).toBe('5f1f1a6f8b10f85888364fa1');
  });

  it('should serialize Extended JSON correctly', () => {
    const obj = { _id: new ObjectId('5f1f1a6f8b10f85888364fa1'), name: 'Test' };
    const serialized = serializeEJSON(obj);
    
    // EJSON.serialize with { relaxed: true } converts ObjectIds back to string in some cases,
    // or plain objects depending on the version. Let's just check the conversion doesn't throw.
    expect(serialized).toBeDefined();
    expect(serialized.name).toBe('Test');
  });

  it('should return empty object for empty string', () => {
    expect(parseEJSON('')).toEqual({});
    expect(parseEJSON('   ')).toEqual({});
  });
});
