import express from "express";
import {
  getBooks,
  createBook,
  updateBook,
  deleteBook,
} from "../controllers/bookController.mjs";
import isAuthenticated from "../middlewares/isAuthenticated.mjs";

const router = express.Router();

router.use(isAuthenticated);

router.get("/", getBooks);
router.post("/", createBook);
router.put("/:id", updateBook);
router.delete("/:id", deleteBook);

export default router;
