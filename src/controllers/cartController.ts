import { Response } from "express";
import prisma from "../config/db";
import { AuthRequest } from "../middleware/authMiddleware";

// GET current user's cart
export const getCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    res.status(200).json(cartItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// ADD item to cart (or increase quantity if it already exists)
export const addToCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { productId, size, quantity } = req.body;

    if (!productId || !size) {
      return res.status(400).json({ message: "productId and size are required" });
    }

    const existingItem = await prisma.cartItem.findUnique({

      where: {
        userId_productId_size: { userId, productId, size },
      },
    });

    let cartItem;

    if (existingItem) {
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + (quantity || 1) },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          userId,
          productId,
          size,
          quantity: quantity || 1,
        },
      });
    }

    res.status(200).json(cartItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// UPDATE cart item quantity
export const updateCartItem = async (req: AuthRequest, res: Response) => {

  try {
   const itemId = req.params.itemId as string;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: "Valid quantity is required" });
    }

    const cartItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    res.status(200).json(cartItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// REMOVE item from cart
export const removeCartItem = async (req: AuthRequest, res: Response) => {
  try {
   const itemId = req.params.itemId as string;

    await prisma.cartItem.delete({ where: { id: itemId } });

    res.status(200).json({ message: "Item removed from cart" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }

};