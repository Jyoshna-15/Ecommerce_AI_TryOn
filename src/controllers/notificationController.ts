import { Response } from "express";
import prisma from "../config/db";
import { messaging } from "../config/firebase";
import { AuthRequest } from "../middleware/authMiddleware";

export const broadcastNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: "Title and body are required" });
    }

    const users = await prisma.user.findMany({
      where: { fcmToken: { not: null } },
      select: { fcmToken: true },
    });

    const tokens = users.map((u) => u.fcmToken).filter((t): t is string => !!t);

    if (tokens.length === 0) {
      return res.status(400).json({ message: "No users with registered devices" });
    }

    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
    });

    res.status(200).json({
      message: "Broadcast sent",
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send broadcast" });
  }
};