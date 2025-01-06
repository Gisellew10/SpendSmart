import express from "express";
import {
  getCustomLabels,
  addCustomLabel,
  deleteCustomLabel,
} from "../controllers/customLabelController.mjs";
import isAuthenticated from "../middlewares/isAuthenticated.mjs";

const router = express.Router();

router.use(isAuthenticated);

router.get("/", getCustomLabels);
router.post("/", addCustomLabel);
router.delete("/", deleteCustomLabel);

export default router;
