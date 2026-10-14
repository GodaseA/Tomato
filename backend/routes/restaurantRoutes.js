
import { Router } from "express";
import {
  getRestaurants,
  getRestaurantMenu,
} from "../controllers/restaurantController.js";

const router = Router();

router.get("/", getRestaurants);
router.get("/:restaurantId/menu", getRestaurantMenu);

export default router;
