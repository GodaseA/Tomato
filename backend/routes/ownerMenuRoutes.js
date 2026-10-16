
import { Router } from "express";
import { z } from "zod";

import {
  getOwnerMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../controllers/ownerMenuController.js";

import { requireAuth, allowRoles } from "../middleware/requireAuth.js";
import validate from "../middleware/validate.js";

const router = Router();

const menuItemSchema = z.object({
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(1000).default(""),
  price: z.number().finite().min(0.01).max(100000),
  image: z.string().url().max(2000).optional().or(z.literal("")),
  imagePublicId: z.string().max(300).optional().or(z.literal("")),
  category: z.string().trim().min(1).max(80),
  foodType: z.enum([
    "vegetarian",
    "non-vegetarian",
    "vegan",
  ]).default("vegetarian"),
  available: z.boolean().default(true),
  preparationTime: z.number().int().min(1).max(240).default(20),
}).strict();

router.use(requireAuth, allowRoles("restaurant"));

router.get("/", getOwnerMenu);

router.post(
  "/",
  validate(menuItemSchema),
  createMenuItem
);

router.patch(
  "/:itemId",
  validate(menuItemSchema),
  updateMenuItem
);

router.delete("/:itemId", deleteMenuItem);

export default router;
