import { Router } from "express";
import { z } from "zod";

import {
  applyForRestaurant,
  editRestaurant,
  getMyRestaurant,
  updateRestaurantAvailability,
} from "../controllers/ownerController.js";

import { requireAuth, allowRoles } from "../middleware/requireAuth.js";
import validate from "../middleware/validate.js";

const router = Router();

const restaurantSchema = z
  .object({
    name: z.string().trim().min(2).max(150),
    description: z.string().trim().max(1000).default(""),
    email: z.string().trim().email().max(254).optional().or(z.literal("")),
    phone: z.string().trim().min(7).max(20),
    address: z
      .object({
        street: z.string().trim().min(2).max(200),
        city: z.string().trim().min(2).max(100),
        state: z.string().trim().min(2).max(100),
        postalCode: z.string().trim().min(4).max(12),
      })
      .strict(),
    image: z.string().url().max(2000).optional().or(z.literal("")),
    imagePublicId: z.string().max(300).optional().or(z.literal("")),
  })
  .strict();

const hello = async (req, res, next) => {
  await console.log("rourrr");
  next();
};
router.post(
  "/restaurant",
  hello,
  requireAuth,
  allowRoles("user"),
  validate(restaurantSchema),
  applyForRestaurant,
);

router.patch(
  "/restaurant/updateDetails",
  requireAuth,
  allowRoles("restaurant"),
  validate(restaurantSchema),
  editRestaurant,
);

router.get(
  "/restaurant/me",
  requireAuth,
  allowRoles("user", "restaurant"),
  getMyRestaurant,
);

router.patch(
  "/restaurant/availability",
  requireAuth,
  allowRoles("restaurant"),
  validate(
    z
      .object({
        isAcceptingOrders: z.boolean(),
      })
      .strict(),
  ),

  updateRestaurantAvailability,
);

export default router;
