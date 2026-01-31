import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  classifyBee,
  getClassificationHistory,
  getClassificationHistoryById,
} from "../controllers/classifyController.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.use(protect, authorizeRoles("USER", "PRACTITIONER", "SUPER_ADMIN"));

router.post("/predict", upload.single("image"), classifyBee);
router.get("/history", getClassificationHistory);
router.get("/history/:id", getClassificationHistoryById);

export default router;
