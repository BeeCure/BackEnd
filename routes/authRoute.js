import express from "express";
import {
  changePassword,
  login,
  logout,
  register,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/logout", logout);
router.post("/change-password", changePassword);

export default router;
