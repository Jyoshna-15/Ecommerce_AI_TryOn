import { Request, Response } from "express";
import prisma from "../config/db";

// GET all products (with optional category/search filter)
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;

    const products = await prisma.product.findMany({
      where: {
        ...(category && { category: category as string }),
        ...(search && {
          name: { contains: search as string, mode: "insensitive" },
        }),
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// GET single product by id
export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const product = await prisma.product.findUnique({ where: { id } });


    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// CREATE product (admin only — we'll add real admin protection next step)
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, category, sizes, stock, imageUrls, attributes } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        category,
        sizes: sizes || [],
        stock: stock || 0,
        imageUrls: imageUrls || [],
        attributes: attributes || undefined,
      },
    });


    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// UPDATE product (admin only)
export const updateProduct = async (req: Request, res: Response) => {
  try {
   const id = req.params.id as string;
    const data = req.body;

    const product = await prisma.product.update({
      where: { id },
      data,
    });

    res.status(200).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// DELETE product (admin only)
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.product.delete({ where: { id } });


    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};