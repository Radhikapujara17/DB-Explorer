"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseEJSON = parseEJSON;
exports.serializeEJSON = serializeEJSON;
exports.stringifyEJSON = stringifyEJSON;
const bson_1 = require("bson");
function parseEJSON(jsonString) {
    if (!jsonString || jsonString.trim() === '')
        return {};
    try {
        return bson_1.EJSON.parse(jsonString, { relaxed: true });
    }
    catch (err) {
        throw new Error(`Invalid JSON / EJSON syntax: ${err.message}`);
    }
}
function serializeEJSON(data) {
    // EJSON.serialize returns EJSON object format; stringify returns string representation.
    // Converting back to JS object with preserved EJSON type tags or relaxed representations.
    return bson_1.EJSON.serialize(data, { relaxed: true });
}
function stringifyEJSON(data) {
    return bson_1.EJSON.stringify(data, undefined, 2, { relaxed: true });
}
