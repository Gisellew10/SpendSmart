import express from "express";
import {
  createTransaction,
  createTransactionsBulk,
  getTransactions,
  deleteTransaction,
  getDashboard,
  getRecommendations,
  getTransactionsByBook,
  updateTransaction,
} from "../controllers/transactionController.mjs";
import isAuthenticated from "../middlewares/isAuthenticated.mjs";

const router = express.Router();

router.get("/book/:bookId", isAuthenticated, getTransactionsByBook);
router.post("/", isAuthenticated, createTransaction);
router.post("/bulk", isAuthenticated, createTransactionsBulk);
router.get("/", isAuthenticated, getTransactions);
router.delete("/:transactionId", isAuthenticated, deleteTransaction);
router.get("/dashboard/:id", isAuthenticated, getDashboard);
router.get("/recommendations/:id", isAuthenticated, getRecommendations);
router.put("/:transactionId", isAuthenticated, updateTransaction);

export default router;
