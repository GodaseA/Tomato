
import { Router } from "express";
import { z } from "zod";

import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
} from "../controllers/authController.js";

import validate from "../middleware/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import authLimiter from "../middleware/authLimiter.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254).transform((value) =>
    value.toLowerCase()
  ),
  password: z.string().min(12).max(128),
}).strict();

const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) =>
    value.toLowerCase()
  ),
  password: z.string().min(1).max(128),
}).strict();

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  register
);

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  login
);

router.post("/logout", logout);

router.get("/me", requireAuth, getMe);

const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(20).optional().default(""),
}).strict();

router.patch("/profile", requireAuth, validate(profileSchema), updateProfile);

export default router;
