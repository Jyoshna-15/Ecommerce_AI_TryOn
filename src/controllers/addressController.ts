import { Response } from "express";
import prisma from "../config/db";
import { AuthRequest } from "../middleware/authMiddleware";

export const getAddresses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const addresses = await prisma.address.findMany({ where: { userId } });
    res.status(200).json(addresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const createAddress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { label, addressLine, city, state, pincode, lat, lng } = req.body;

    if (!label || !addressLine || !city || !state || !pincode) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const address = await prisma.address.create({
      data: { userId, label, addressLine, city, state, pincode, lat, lng },
    });

    res.status(201).json(address);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });

  }
};

export const deleteAddress = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.address.delete({ where: { id } });
    res.status(200).json({ message: "Address deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};