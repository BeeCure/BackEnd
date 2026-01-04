import express from "express";
import {
  changePassword,
  login,
  logout,
  register,
  resendTokenOTP,
  verifyTokenOTP,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/logout", logout);
router.post("/change-password", changePassword);
router.post("/verify-token-otp", verifyTokenOTP);
router.post("/resend-token-otp", resendTokenOTP);

export default router;
