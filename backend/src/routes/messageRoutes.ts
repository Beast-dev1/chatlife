import { Router } from "express";
import {
  listMessages,
  createMessage,
} from "../controllers/messageController";
import { authMiddleware } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(authMiddleware);

router.get("/:chatId/messages", asyncHandler(listMessages));
router.post("/:chatId/messages", asyncHandler(createMessage));

export default router;
