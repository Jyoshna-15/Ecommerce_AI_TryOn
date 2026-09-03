import { Response } from "express";
import prisma from "../config/db";
import { AuthRequest } from "../middleware/authMiddleware";
import { messaging } from "../config/firebase";
// CREATE order from current cart
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { addressId } = req.body;

    if (!addressId) {
      return res.status(400).json({ message: "addressId is required" });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Check stock availability before proceeding
    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for ${item.product.name}`,
        });
      }
    }


    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    // Run everything as one atomic transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          addressId,
          totalAmount,
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

      // Reduce stock for each product
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }


      // Clear the user's cart
      await tx.cartItem.deleteMany({ where: { userId } });

      return newOrder;
    });
        // Send push notification
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.fcmToken) {
      try {
        await messaging.send({
  token: user.fcmToken,
  notification: {
    title: "Order Placed! 🎉",
    body: `Your order #${order.id.slice(0, 8)} has been placed successfully.`,
  },
});
      } catch (notifError) {
        console.error("Failed to send notification:", notifError);
      }
    }

    res.status(201).json(order);

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// GET all orders for logged-in user
export const getUserOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } }, address: true },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// GET single order by id

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, address: true },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// UPDATE order status (admin only)
export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};