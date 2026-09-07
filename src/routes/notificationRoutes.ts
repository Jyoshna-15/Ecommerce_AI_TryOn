import { Router } from "express";
import { broadcastNotification } from "../controllers/notificationController";
import { protect, isAdmin } from "../middleware/authMiddleware";

const router = Router();

router.post("/broadcast", protect, isAdmin, broadcastNotification);

export default router;