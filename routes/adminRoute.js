import express from "express";
import {
  approvePractitioner,
  rejectPractitioner,
} from "../controllers/adminController.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect, authorizeRoles("SUPER_ADMIN"));

router.post("/approve/:userId", approvePractitioner);
router.post("/reject/:userId", rejectPractitioner);

export default router;
