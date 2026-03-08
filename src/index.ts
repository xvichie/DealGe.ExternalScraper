import express from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";

import myAutoRoutes from "./routes/myauto";
import copartRoutes from "./routes/copart";
import iaaiRoutes from "./routes/iaai";
import carsbidshistoryroutes from "./routes/carsbidshistory";

const app = express();

app.use(express.json());

// Swagger
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/myauto", myAutoRoutes);
app.use("/copart", copartRoutes);
app.use("/iaai", iaaiRoutes);
app.use("/carbidshistory", carsbidshistoryroutes);

export default app;