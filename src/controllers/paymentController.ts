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

// STEP 1: Create a Razorpay order. The amount is calculated on the server
// from the user's cart. Anything the phone sends as "amount" is ignored.
export const createPaymentOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const cart = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cart.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    for (const item of cart) {
      if (item.product.stock < item.quantity) {
        return res
          .status(400)
          .json({ message: `Not enough stock for ${item.product.name}` });
      }
    }

    const total = cart.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100), // Razorpay expects paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: { userId }, // lets us confirm later that this order belongs to this user
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

// STEP 2: Verify the payment after the user pays, then create the real order
export const verifyPaymentAndCreateOrder = async (
  req: AuthRequest,
  res: Response
) => {
  const userId = req.user!.userId;
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    addressId,
  } = req.body;

  try {
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !addressId
    ) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    // 1. Verify the signature really came from Razorpay
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // 2. Replay protection: this payment may already have created an order
    const existing = await prisma.order.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
    });
    if (existing) {
      if (existing.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      return res.status(200).json(existing);
    }

    // 3. The address must belong to this user
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) {
      return res.status(400).json({ message: "Invalid address" });
    }

    // 4. Rebuild the total from the cart on the server
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

    // 5. The Razorpay order must belong to this user and match the cart total
    const rpOrder = await razorpay.orders.fetch(razorpay_order_id);
    if (
      (rpOrder.notes as any)?.userId !== userId ||
      Number(rpOrder.amount) !== Math.round(totalAmount * 100)
    ) {
      return res.status(400).json({ message: "Payment amount mismatch" });
    }

    // 6. Create the order atomically
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          addressId,
          totalAmount,
          paymentStatus: "PAID",
          razorpayOrderId: razorpay_order_id,
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
        // Only decrements if enough stock remains, in a single atomic step
        const result = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (result.count === 0) throw new Error("OUT_OF_STOCK");
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

    // 7. A notification failure must never break the order response
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

    return res.status(201).json(order);
  } catch (error: any) {
    // Two simultaneous verify calls: the unique constraint blocked the second one
    if (error?.code === "P2002") {
      const existing = await prisma.order.findUnique({
        where: { razorpayOrderId: razorpay_order_id },
      });
      if (existing && existing.userId === userId) {
        return res.status(200).json(existing);
      }
    }

    // An item sold out after the customer paid: refund automatically
    if (error?.message === "OUT_OF_STOCK") {
      try {
        await razorpay.payments.refund(razorpay_payment_id, {});
      } catch (refundError) {
        console.error(
          "REFUND FAILED, handle manually:",
          razorpay_payment_id,
          refundError
        );
      }
      return res.status(409).json({
        message:
          "An item sold out while you were paying. Your payment is being refunded.",
      });
    }

    console.error(error);
    return res.status(500).json({ message: "Payment verification failed" });
  }
};