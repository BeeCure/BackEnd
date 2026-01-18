import express from "express";
import {
  getAllPractitioners,
  getAllUsers,
  getProfile,
  updateProfile,
} from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import { uploadAvatar } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/all", authorizeRoles("SUPER_ADMIN"), getAllUsers);
router.get(
  "/practitioners",
  authorizeRoles("SUPER_ADMIN"),
  getAllPractitioners
);
router.get("/profile", authorizeRoles("USER", "PRACTITIONER"), getProfile);
router.put(
  "/update-profile",
  uploadAvatar.single("avatar"),
  authorizeRoles("USER", "PRACTITIONER"),
  updateProfile
);

export default router;
