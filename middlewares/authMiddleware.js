import jwt from "jsonwebtoken";
import db from "../firestore.js";

const usersCollection = db.collection("users");

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Token tidak ditemukan",
      });
    }

    // Verifikasi JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Ambil user dari Firestore
    const userDoc = await usersCollection.doc(userId).get();
    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User tidak valid",
      });
    }

    const userData = userDoc.data();

    // Email verification check
    if (!userData.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Email anda belum terverifikasi. Silakan verifikasi terlebih dahulu.",
      });
    }

    // User Practitioner approval check
    if (
      userData.role === "PRACTITIONER" &&
      userData.approvalStatus !== "APPROVED"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Akun praktisi anda belum disetujui. Silakan tunggu konfirmasi dari admin.",
      });
    }

    req.user = {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token telah kedaluwarsa",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token tidak valid",
      });
    }

    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Server internal sedang bermasalah",
    });
  }
};
