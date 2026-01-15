import express from "express";
import { getProfile, updateProfile } from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import { uploadAvatar } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.use(protect, authorizeRoles("USER", "PRACTITIONER"));

router.get("/profile", getProfile);
router.put("/update-profile", uploadAvatar.single("avatar"), updateProfile);

export default router;
