import express from "express";
import {
  approvePractitioner,
  inactivateUser,
  reactivateUser,
  rejectPractitioner,
} from "../controllers/adminController.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect, authorizeRoles("SUPER_ADMIN"));

router.post("/approve/:userId", approvePractitioner);
router.post("/reject/:userId", rejectPractitioner);
router.patch("/:userId/inactivate", inactivateUser);
router.patch("/:userId/reactivate", reactivateUser);

export default router;
