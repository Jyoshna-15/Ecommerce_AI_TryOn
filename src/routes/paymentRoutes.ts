import { Router } from "express";
import { createPaymentOrder, verifyPaymentAndCreateOrder } from "../controllers/paymentController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.post("/create-order", protect, createPaymentOrder);
router.post("/verify", protect, verifyPaymentAndCreateOrder);

export default router;