import { Router } from "express";
import { createCustomerOrder, getMyOrders, getMyOrderById } from "../controllers/orderController.js";
import { requireAuth, allowRoles } from "../middleware/requireAuth.js";

const router = Router();

router.use(requireAuth, allowRoles("user"));
router.post("/", createCustomerOrder);
router.get("/my", getMyOrders);
router.get("/:orderId", getMyOrderById);

export default router;
