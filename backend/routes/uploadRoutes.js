import { Router } from "express";
import { requireAuth, allowRoles } from "../middleware/requireAuth.js";
import uploadImage from "../middleware/uploadImage.js";
import { uploadMenuImage, uploadRestaurantImage, uploadProfileImage } from "../controllers/uploadController.js";

const router = Router();
router.post("/menu", requireAuth, allowRoles("restaurant"), uploadImage.single("image"), uploadMenuImage);
router.post("/restaurant", requireAuth, allowRoles("user","restaurant"), uploadImage.single("image"), uploadRestaurantImage);
router.post("/profile", requireAuth, uploadImage.single("image"), uploadProfileImage);
export default router;
