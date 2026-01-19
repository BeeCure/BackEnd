import express from "express";
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  reapplyPractitionerByToken,
  register,
  resendTokenOTP,
  resetPassword,
  verifyTokenOTP,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post(
  "/logout",
  protect,
  authorizeRoles("USER", "PRACTITIONER", "SUPER_ADMIN"),
  logout,
);
router.post("/reapply", reapplyPractitionerByToken);
router.post("/change-password", protect, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-token-otp", verifyTokenOTP);
router.post("/resend-token-otp", resendTokenOTP);

export default router;
