"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./swagger");
const myauto_1 = __importDefault(require("./routes/myauto"));
const copart_1 = __importDefault(require("./routes/copart"));
const iaai_1 = __importDefault(require("./routes/iaai"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Swagger
app.use("/swagger", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
// Routes
app.use("/myauto", myauto_1.default);
app.use("/copart", copart_1.default);
app.use("/iaai", iaai_1.default);
exports.default = app;
