import express from "express";
import {
  createBudgeting,
  getBudget,
  getGoal,
  updateBudgetingsAmount,
  deleteBudgeting,
} from "../controllers/budgetingController.mjs";
import isAuthenticated from "../middlewares/isAuthenticated.mjs";

const router = express.Router();

router.post("/", isAuthenticated, createBudgeting);
router.get("/budgets/one/:relatedBookId", isAuthenticated, getBudget);
router.get("/goals/one/:relatedBookId", isAuthenticated, getGoal);
router.delete("/:budgetingId", isAuthenticated, deleteBudgeting);

export default router;
