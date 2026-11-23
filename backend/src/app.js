import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
//basic configuration

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//cors configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
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
