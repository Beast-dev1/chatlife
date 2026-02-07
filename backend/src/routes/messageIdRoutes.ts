import { Router } from "express";
import {
  searchMessages,
  updateMessage,
  deleteMessage,
  markMessageRead,
} from "../controllers/messageController";
import { authMiddleware } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(authMiddleware);

router.get("/search", asyncHandler(searchMessages));
router.put("/:id", asyncHandler(updateMessage));
router.delete("/:id", asyncHandler(deleteMessage));
router.post("/:id/read", asyncHandler(markMessageRead));

export default router;
