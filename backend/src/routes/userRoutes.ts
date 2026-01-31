import { Router } from "express";
import { searchUsers } from "../controllers/contactController";
import { authMiddleware } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(authMiddleware);
router.get("/search", asyncHandler(searchUsers));

export default router;
