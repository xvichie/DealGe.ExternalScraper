"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
exports.swaggerSpec = (0, swagger_jsdoc_1.default)({
    definition: {
        openapi: "3.0.0",
        info: {
            title: "External Listings Scraper API",
            version: "1.0.0",
            description: "Internal scraper service for MyAuto, Copart, IAAI. Returns raw listing data.",
        },
        servers: [
            {
                url: "http://localhost:3001",
                description: "Local",
            },
            {
                url: "https://your-lambda-url.amazonaws.com",
                description: "Production",
            },
        ],
    },
    apis: ["./src/routes/**/*.ts"],
});
