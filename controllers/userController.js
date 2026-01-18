import { bucket, db } from "../firestore.js";

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
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        address: userData.address ?? null,
        avatarUrl: userData.avatarUrl ?? null,
        lastLogin: userData.previousLogin
          ? new Intl.DateTimeFormat("id-ID", {
              dateStyle: "long",
              timeStyle: "medium",
              timeZone: "Asia/Jakarta",
            }).format(userData.previousLogin.toDate())
          : null,
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

    if (req.file) {
      // hapus avatar lama (jika ada)
      await Promise.all([
        bucket
          .file(`avatars/${userId}.png`)
          .delete()
          .catch(() => {}),
        bucket
          .file(`avatars/${userId}.jpg`)
          .delete()
          .catch(() => {}),
        bucket
          .file(`avatars/${userId}.jpeg`)
          .delete()
          .catch(() => {}),
      ]);

      const filePath = `avatars/${userId}.png`;
      const file = bucket.file(filePath);

      await file.save(req.file.buffer, {
        metadata: {
          contentType: "image/png",
          cacheControl: "public, max-age=31536000",
        },
        public: true,
      });

      updateData.avatarUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
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

export const getAllUsers = async (req, res) => {
  try {
    // 🔐 ROLE GUARD
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak",
      });
    }

    let query = usersCollection.where();

    const { role, status, approvalStatus } = req.query;

    if (role) {
      query = query.where("role", "==", role.toUpperCase());
    }

    if (status) {
      query = query.where("status", "==", status.toUpperCase());
    }

    if (approvalStatus) {
      query = query.where("approvalStatus", "==", approvalStatus.toUpperCase());
    }

    const snapshot = await query.get();

    const users = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        name: data.name ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        role: data.role ?? null,
        avatarUrl: data.avatarUrl ?? null,
        status: data.status ?? null,
        approvalStatus: data.approvalStatus ?? null,
        isEmailVerified: data.isEmailVerified ?? false,
        createdAt: data.createdAt ?? null,
        updatedAt: data.updatedAt ?? null,
      };
    });

    return res.status(200).json({
      success: true,
      total: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data user",
    });
  }
};

export const getAllPractitioners = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak",
      });
    }

    let query = usersCollection.where("role", "==", "PRACTITIONER");

    const { status, approvalStatus } = req.query;

    if (status) {
      query = query.where("status", "==", status.toUpperCase());
    }

    if (approvalStatus) {
      query = query.where("approvalStatus", "==", approvalStatus.toUpperCase());
    }

    const snapshot = await query.get();

    const practitioners = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        name: data.name ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        avatarUrl: data.avatarUrl ?? null,
        status: data.status ?? null,
        approvalStatus: data.approvalStatus ?? null,
        isEmailVerified: data.isEmailVerified ?? false,
        createdAt: data.createdAt ?? null,
        updatedAt: data.updatedAt ?? null,
      };
    });

    return res.status(200).json({
      success: true,
      total: practitioners.length,
      data: practitioners,
    });
  } catch (error) {
    console.error("Get all practitioners error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data practitioner",
    });
  }
};
