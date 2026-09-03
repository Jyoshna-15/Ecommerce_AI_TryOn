import { Router } from "express";
import { signup, login,updateFcmToken } from "../controllers/authController";
import { protect,  } from "../middleware/authMiddleware";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/fcm-token", protect, updateFcmToken);

export default router;