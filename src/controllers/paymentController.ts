import { Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import prisma from "../config/db";
import { AuthRequest } from "../middleware/authMiddleware";
import { messaging } from "../config/firebase";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

// STEP 1: Create a Razorpay order (called BEFORE our own order exists)
export const createPaymentOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { amount } = req.body; // amount in rupees

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Valid amount is required" });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Razorpay expects paise (amount * 100)
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    res.status(200).json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create payment order" });
  }
};

// STEP 2: Verify payment signature AFTER user pays, then create the real order
export const verifyPaymentAndCreateOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      addressId,
    } = req.body;

    // Verify the payment signature to confirm it's genuinely from Razorpay
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Payment is verified — now create the actual order (same logic as before)
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          addressId,
          totalAmount,
          paymentStatus: "PAID",
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              size: item.size,
              quantity: item.quantity,
              priceAtPurchase: item.product.price,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({ where: { userId } });

      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          paymentGatewayId: razorpay_payment_id,
          amount: totalAmount,
          status: "PAID",
          method: "razorpay",
        },
      });

      return newOrder;
    });

    // Send push notification (don't let a notification failure break the order response)
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.fcmToken) {
        await messaging.send({
          token: user.fcmToken,
          notification: {
            title: "Payment Successful! 🎉",
            body: `Your order #${order.id.slice(0, 8)} has been placed successfully.`,
          },
        });
      }
    } catch (notifError) {
      console.error("Failed to send notification:", notifError);
    }

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Payment verification failed" });
  }
};