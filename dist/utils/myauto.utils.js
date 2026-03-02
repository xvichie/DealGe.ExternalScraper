"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractMyAutoProductId = extractMyAutoProductId;
function extractMyAutoProductId(url) {
    console.log(url);
    const match = url.match(/\/pr\/(\d+)/);
    if (!match) {
        throw new Error("Invalid MyAuto URL");
    }
    return match[1];
}
