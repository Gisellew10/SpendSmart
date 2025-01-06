import express from "express";
import {
  createUser,
  loginUser,
  logoutUser,
  loginUserGoogle,
  loginUserGoogleCallback,
  getUser,
} from "../controllers/authController.mjs";

const router = express.Router();

router.post("/signup", createUser);
router.post("/signin", loginUser);
router.post("/signout", logoutUser);
router.get("/google", loginUserGoogle);
router.get("/google/callback", loginUserGoogleCallback);
router.get("/user", getUser);

export default router;
