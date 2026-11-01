require("dotenv").config();
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const entriesRouter = require("./routes/entries");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
const port = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false })); // CSP disabled for the CDN-loaded Supabase browser SDK; configure a strict CSP for production.
app.use(express.json({ limit: "30kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5500",
    "http://127.0.0.1:5500"
  ],
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: "draft-7", legacyHeaders: false }));
app.get("/api/health", (req, res) => res.json({ status: "ok", app: "MoodNest API" }));
app.use("/api/entries", entriesRouter);
app.use(express.static(path.resolve(__dirname, "../frontend")));
app.get("/", (req, res) => res.sendFile(path.resolve(__dirname, "../frontend/index.html")));
app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`MoodNest is running at http://localhost:${port}`);
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) console.warn("Set SUPABASE_URL and SUPABASE_ANON_KEY in backend/.env before using the app.");
});