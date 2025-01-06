import { createServer } from "http";
import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import cors from "cors";

import passportConfig from "./configs/passport.mjs";

import authRoutes from "./routes/auth.mjs";
import transactionRoutes from "./routes/transaction.mjs";
import bookRoutes from "./routes/books.mjs";
import budgetRoutes from "./routes/budgets.mjs";
import ocrRoutes from "./routes/ocr.mjs";
import reportsRoutes from "./routes/reports.mjs";
import customLabelsRoutes from "./routes/customLabels.js";

import cron from "node-cron";
import {
  generateWeeklyReports,
  generateMonthlyReports,
} from "./controllers/reportController.mjs";

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

if (process.env.NODE_ENV !== "prod") {
  const corsOptions = {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  };
  app.use(cors(corsOptions));
}

app.set("trust proxy", 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "prod",
      sameSite: "strict",
    },
  }),
);
app.use(passportConfig.initialize());
app.use(passportConfig.session());

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/budgetings", budgetRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/custom-labels", customLabelsRoutes);

cron.schedule("0 0 * * *", async () => {
  const date = new Date();
  const weekday = date.getDay();
  if (weekday == 1) {
    await generateWeeklyReports();
  }
});

cron.schedule("0 0 * * *", async () => {
  const date = new Date();
  const day = date.getDate();
  if (day == 1) {
    await generateMonthlyReports();
  }
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "test") {
  createServer(app).listen(PORT, function (err) {
    if (err) console.log(err);
    else console.log("HTTP server on port %s", PORT);
  });
}

export { app };
