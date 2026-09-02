import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes";
import cartRoutes from "./routes/cartRoutes";
import orderRoutes from "./routes/orderRoutes";
import addressRoutes from "./routes/addressRoutes";
import paymentRoutes from "./routes/paymentRoutes";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/addresses", addressRoutes);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});