import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import helmet from "helmet";
import path from "path";
import router from "./routes";

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  console.error("FATAL: SESSION_SECRET environment variable is not set.");
  process.exit(1);
}

const app: Express = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "same-site" },
}));

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

app.use("/api", router);

export default app;
