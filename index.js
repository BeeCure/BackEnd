import "dotenv/config";
import express from "express";
import authRoutes from "./routes/authRoute.js";
import adminRoutes from "./routes/adminRoute.js";
import userRoutes from "./routes/userRoute.js";
import beeRoutes from "./routes/beeRoute.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  }),
);

// Endpoint
app.use("/api/auth", authRoutes);
app.use("/api/admin/practitioners", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/bee", beeRoutes);

// Test
app.get("/", (req, res) => {
  res.send("Selamat Datang Bee Family");
});

// Watch link w/ terminal
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
