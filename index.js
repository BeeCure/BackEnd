import "dotenv/config";
import express from "express";
import authRoutes from "./routes/authRoute.js";
import adminRoutes from "./routes/adminRoute.js";
import cookieParser from "cookie-parser";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

// Endpoint
app.use("/api/auth", authRoutes);
app.use("/api/admin/practitioners", adminRoutes);

// Test
app.get("/", (req, res) => {
  res.send("Selamat Datang Bee Family");
});

// Watch link w/ terminal
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
