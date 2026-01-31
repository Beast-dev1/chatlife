import { Router } from "express";
import {
  listChats,
  createChat,
  getChat,
  updateChat,
  deleteChat,
  addMember,
  removeMember,
} from "../controllers/chatController";
import { authMiddleware } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(authMiddleware);

router.get("/", asyncHandler(listChats));
router.post("/", asyncHandler(createChat));
router.get("/:id", asyncHandler(getChat));
router.put("/:id", asyncHandler(updateChat));
router.delete("/:id", asyncHandler(deleteChat));
router.post("/:id/members", asyncHandler(addMember));
router.delete("/:id/members/:userId", asyncHandler(removeMember));

export default router;
