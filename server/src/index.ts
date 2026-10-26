import { env } from "./config/env";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import workflowRoutes from "./routes/workflows";
import runRoutes from "./routes/runs";
import documentRoutes from "./routes/documents";
import hookRoutes from "./routes/hooks";
import "./queue/worker";

const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.text({ type: "text/*", limit: "100kb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api", runRoutes);
app.use("/api/hooks", hookRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server" });
});

app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});