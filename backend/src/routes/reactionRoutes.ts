import { Router } from "express";
import { addReaction, removeReaction } from "../controllers/reactionController";
import { authMiddleware } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(authMiddleware);

router.post("/:id/reactions", asyncHandler(addReaction));
router.delete("/:id/reactions/:emoji", asyncHandler(removeReaction));

export default router;
