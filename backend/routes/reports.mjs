import express from "express";
import {
  createReport,
  generateWeeklyReports,
  generateMonthlyReports,
  getWeeklyReports,
  getMonthlyReports,
  deleteReport,
} from "../controllers/reportController.mjs";
import isAuthenticated from "../middlewares/isAuthenticated.mjs";

const router = express.Router();

router.post("/", isAuthenticated, createReport);
router.post("/weekly", generateWeeklyReports);
router.post("/monthly", generateMonthlyReports);
router.get("/weekly/:relatedBookId", isAuthenticated, getWeeklyReports);
router.get("/monthly/:relatedBookId", isAuthenticated, getMonthlyReports);
router.delete("/:reportId", isAuthenticated, deleteReport);

export default router;
