import { bucket } from "../config/firebase.js";
import db from "../firestore.js";

const usersCollection = db.collection("users");

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const userDoc = await usersCollection.doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    const userData = userDoc.data();

    res.status(200).json({
      success: true,
      data: {
        email: userData.email,
        name: userData.name,
        role: userData.role,
        avatarUrl: userData.avatarUrl ?? null,
        address: userData.address ?? null,
        lastLogin: userData.previousLogin ?? null,
      },
    });
  } catch (err) {
    console.error("Error getting profile:", err);
    res.status(500).json({
      success: false,
      message: "Server internal sedang bermasalah",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, phone, address } = req.body;

    if (!name && !phone && !address && !req.file) {
      return res.status(400).json({
        success: false,
        message: "Tidak ada data yang diperbarui",
      });
    }

    const userRef = usersCollection.doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    const updateData = {};

    // ===== TEXT FIELDS =====
    if (name) {
      if (typeof name !== "string" || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: "Nama tidak valid",
        });
      }
      updateData.name = name.trim();
    }

    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;

    // ===== AVATAR =====
    if (req.file) {
      const fileExt = req.file.originalname.split(".").pop();
      const fileName = `avatars/${userId}.${fileExt}`;

      const file = bucket.file(fileName);

      await file.save(req.file.buffer, {
        contentType: req.file.mimetype,
        public: true,
        metadata: {
          cacheControl: "public, max-age=31536000",
        },
      });

      updateData.avatarUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    }

    updateData.updatedAt = new Date();

    await userRef.update(updateData);

    return res.status(200).json({
      success: true,
      message: "Profil berhasil diperbarui",
      data: updateData,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server internal sedang bermasalah",
    });
  }
};
