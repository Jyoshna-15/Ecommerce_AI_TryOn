import { Router } from "express";
import { getAddresses, createAddress, deleteAddress } from "../controllers/addressController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.get("/", protect, getAddresses);
router.post("/", protect, createAddress);
router.delete("/:id", protect, deleteAddress);

export default router;