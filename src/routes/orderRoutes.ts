import { Router } from "express";
import {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/orderController";
import { protect, isAdmin } from "../middleware/authMiddleware";

const router = Router();

router.post("/", protect, createOrder);
router.get("/", protect, getUserOrders);
router.get("/:id", protect, getOrderById);
router.patch("/:id/status", protect, isAdmin, updateOrderStatus);

export default router;