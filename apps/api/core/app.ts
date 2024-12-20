import express, { Express } from "express";
import dotenv from "dotenv";
import cors from "cors";

import { userRoute } from "../routes/userRoutes";
import { logger } from "../middleware/loggerMiddleware";
import { errorMiddleware } from "../middleware/errorMiddeware";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(logger);
app.use(cors());

app.use(userRoute);

app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});