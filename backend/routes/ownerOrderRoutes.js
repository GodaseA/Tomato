import { Router } from "express";
import { z } from "zod";
import { getOwnerOrders, updateOwnerOrderStatus } from "../controllers/ownerOrderController.js";
import { requireAuth, allowRoles } from "../middleware/requireAuth.js";
import validate from "../middleware/validate.js";

const router = Router();
router.use(requireAuth, allowRoles("restaurant"));
router.get("/", getOwnerOrders);
router.patch("/:orderId/status", validate(z.object({ status: z.enum(["confirmed", "preparing", "ready_for_pickup", "out_for_delivery", "delivered", "rejected"]) }).strict()), updateOwnerOrderStatus);
export default router;
