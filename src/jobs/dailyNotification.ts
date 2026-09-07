import cron from "node-cron";
import prisma from "../config/db";
import { messaging } from "../config/firebase";

const messages = [
  { title: "New Collection! 🛍️", body: "Check out our freshest arrivals today." },
  { title: "Don't Miss Out! ✨", body: "Trending styles are waiting for you." },
  { title: "Style Update 👕", body: "New looks just dropped. Come take a peek!" },
];

export const startDailyNotificationJob = () => {
  cron.schedule(
    "32 10 * * *",
    async () => {
      console.log("Running daily notification job...");

      const users = await prisma.user.findMany({
        where: { fcmToken: { not: null } },
        select: { fcmToken: true },
      });

      const tokens = users.map((u) => u.fcmToken).filter((t): t is string => !!t);

      if (tokens.length === 0) {
        console.log("No users to notify");
        return;
      }

      const randomMessage = messages[Math.floor(Math.random() * messages.length)];

      try {
        const response = await messaging.sendEachForMulticast({
          tokens,
          notification: randomMessage,
        });
        console.log(`Daily notification sent: ${response.successCount} succeeded`);
      } catch (error) {
        console.error("Daily notification job failed:", error);
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  console.log("Daily notification job scheduled for 10:00 AM IST");
};