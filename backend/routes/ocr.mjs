import express from "express";
import multer from "multer";
import {
  uploadAndExtract,
  saveTransactions,
} from "../controllers/ocrController.mjs";
import isAuthenticated from "../middlewares/isAuthenticated.mjs";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post(
  "/upload",
  isAuthenticated,
  upload.single("document"),
  uploadAndExtract,
);
router.post("/save", isAuthenticated, saveTransactions);

export default router;
