
import { Router } from "express";
import { z } from "zod";

import {
  getRestaurantApplications,
  reviewRestaurantApplication,
  updateRestaurantStatus,
} from "../controllers/adminRestaurantController.js";

import { requireAuth, allowRoles } from "../middleware/requireAuth.js";
import validate from "../middleware/validate.js";

const router = Router();

router.use(requireAuth, allowRoles("admin"));

router.get("/", getRestaurantApplications);

router.patch(
  "/:restaurantId/review",
  validate(z.object({
    decision: z.enum(["approve", "reject"]),
    rejectionReason: z.string().trim().max(500).default(""),
  }).strict()),
  reviewRestaurantApplication
);

router.patch(
  "/:restaurantId/status",
  validate(z.object({
    status: z.enum(["approved", "suspended"]),
  }).strict()),
  updateRestaurantStatus
);

export default router;
