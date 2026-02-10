import { Router } from "express";
import {
  listContacts,
  listContactRequests,
  createContact,
  updateContact,
  deleteContact,
} from "../controllers/contactController";
import { authMiddleware } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(authMiddleware);

router.get("/", asyncHandler(listContacts));
router.get("/requests", asyncHandler(listContactRequests));
router.post("/", asyncHandler(createContact));
router.put("/:id", asyncHandler(updateContact));
router.delete("/:id", asyncHandler(deleteContact));

export default router;
