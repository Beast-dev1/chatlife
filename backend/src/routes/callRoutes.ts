import { Router } from "express";
import { listCalls, createCall, updateCall } from "../controllers/callController";
import { authMiddleware } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(authMiddleware);

router.get("/", asyncHandler(listCalls));
router.post("/", asyncHandler(createCall));
router.put("/:id", asyncHandler(updateCall));

export default router;
