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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userDoc = await usersCollection.doc(decoded.userId).get();

    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User tidak valid",
      });
    }

    const userData = userDoc.data();

    req.user = {
      id: userDoc.id,
      role: userData.role,
      email: userData.email,
      name: userData.name,
      isEmailVerified: userData.isEmailVerified,
      approvalStatus: userData.approvalStatus,
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
