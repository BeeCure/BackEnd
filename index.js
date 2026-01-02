import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoute.js";

dotenv.config({ silent: true });
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Endpoint
app.use("/api/auth", authRoutes);

// Test
app.get("/", (req, res) => {
  res.send("Selamat Datang Bee Family");
});

// Watch link w/ terminal
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
