import express from "express";
import {
  createActivity,
  deleteActivity,
  getActivityDetail,
  getActivityList,
  updateActivity,
} from "../controllers/activitiesController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorizeRoles("SUPER_ADMIN"),
  upload.single(["image"]),
  createActivity,
);
router.get("/all", getActivityList);
router.get("/:id", getActivityDetail);
router.put(
  "/:id",
  protect,
  authorizeRoles("SUPER_ADMIN"),
  upload.single(["image"]),
  updateActivity,
);
router.delete("/:id", protect, authorizeRoles("SUPER_ADMIN"), deleteActivity);

export default router;
