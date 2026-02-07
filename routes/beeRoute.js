import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import {
  createSpecies,
  deleteSpecies,
  getSpeciesDetail,
  getSpeciesList,
  updateSpecies,
} from "../controllers/beeController.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.use(protect);

router.post(
  "/add",
  authorizeRoles("PRACTITIONER", "SUPER_ADMIN"),
  upload.fields([
    { name: "bodyShape", maxCount: 1 },
    { name: "wingShape", maxCount: 1 },
    { name: "entranceShape", maxCount: 1 },
    { name: "honeyPouchShape", maxCount: 1 },
  ]),
  createSpecies,
);
router.get("/species", getSpeciesList);
router.get("/species/:id", getSpeciesDetail);
router.put(
  "/species/:id",
  authorizeRoles("PRACTITIONER", "SUPER_ADMIN"),
  upload.fields([
    { name: "bodyShape", maxCount: 1 },
    { name: "wingShape", maxCount: 1 },
    { name: "entranceShape", maxCount: 1 },
    { name: "honeyPouchShape", maxCount: 1 },
  ]),
  updateSpecies,
);
router.delete("/species/:id", authorizeRoles("SUPER_ADMIN"), deleteSpecies);

export default router;
