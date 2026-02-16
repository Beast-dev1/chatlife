import { Router } from "express";
import {
  register,
  login,
  googleAuth,
  refresh,
  logout,
  me,
  updateProfile,
  forgotPassword,
  resetPassword,
} from "../controllers/authController";
import { authMiddleware } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/google", asyncHandler(googleAuth));
router.post("/forgot-password", asyncHandler(forgotPassword));
router.post("/reset-password", asyncHandler(resetPassword));
router.post("/refresh", asyncHandler(refresh));
router.post("/logout", authMiddleware, asyncHandler(logout));

router.get("/me", authMiddleware, asyncHandler(me));
router.put("/profile", authMiddleware, asyncHandler(updateProfile));

export default router;
