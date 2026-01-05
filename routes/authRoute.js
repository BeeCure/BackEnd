import express from "express";
import {
  changePassword,
  login,
  logout,
  register,
  resendTokenOTP,
  verifyTokenOTP,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/login", login);
router.post("/register", register);
router.post(
  "/logout",
  authorizeRoles("USER", "PRACTITIONER", "SUPER_ADMIN"),
  logout
);
router.post("/change-password", changePassword);
router.post("/verify-token-otp", verifyTokenOTP);
router.post("/resend-token-otp", resendTokenOTP);

export default router;
