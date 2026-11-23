import path from "path";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
app.set("trust proxy", 1);
//basic configuration

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(
  express.static(path.resolve(import.meta.dirname, "../public"), {
    maxAge: "7d",
    etag: true,
  }),
);
app.use(cookieParser());

//cors configuration
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

import healthCheckRouter from "./routes/healthcheck.route.js";
import authRouter from "./routes/auth.route.js";
import projectRouter from "./routes/project.route.js";
import taskRouter from "./routes/task.route.js";
import noteRouter from "./routes/note.route.js";

app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/projects", projectRouter);
app.use("/api/v1/projects/:projectId/tasks", taskRouter);
app.use("/api/v1/projects/:projectId/notes", noteRouter);


app.get("/", (req, res) => res.send("Hello World!"));

// global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    statusCode,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
    success: false,
    data: null,
  });
});

export default app;
