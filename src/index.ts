import express from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";
import dotenv from "dotenv";
import myAutoRoutes from "./routes/myauto";
import copartRoutes from "./routes/copart";
import carsbidshistoryroutes from "./routes/carsbidshistory";
import bidmotorsroutes from "./routes/bidmotors";
import bidcarsroutes from "./routes/bidcars";

const app = express();

app.use(express.json());

dotenv.config();

// Swagger
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/myauto", myAutoRoutes);
app.use("/copart", copartRoutes);
app.use("/carbidshistory", carsbidshistoryroutes);
app.use("/bidmotors", bidmotorsroutes);
app.use("/bidcars", bidcarsroutes);

export default app;