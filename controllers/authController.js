import bcrypt from "bcrypt";
import { generateTokenSetCookie } from "../utils/generateTokenSetCookie.js";
import { v4 as uuidv4 } from "uuid";
import db from "../firestore.js";

const usersCollection = db.collection("users");

export const register = async (req, res) => {
  try {
    const { email, password, name, role, phone, facebookUrl } = req.body;

    if (!email || !password || !name || !role || !phone) {
      return res.status(400).json({
        success: false,
        message: "Oooppss! Lengkapi dulu data anda!",
      });
    }

    const allowedRoles = ["USER", "PRACTITIONER"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role tidak valid. Pilih USER atau PRACTITIONER!",
      });
    }

    if (role === "PRACTITIONER" && !facebookUrl) {
      return res.status(400).json({
        success: false,
        message: "Link Facebook wajib diisi untuk praktisi",
      });
    }

    const existingUser = await usersCollection
      .where("email", "==", email.toLowerCase())
      .get();

    if (!existingUser.empty) {
      return res.status(400).json({
        success: false,
        message: "Email sudah terdaftar",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const userId = uuidv4();

    const isPractitioner = role === "PRACTITIONER";

    const newUser = {
      id: userId,
      email: email.toLowerCase(),
      name,
      role,
      phone,
      password: hashedPassword,

      // STATUS
      status: isPractitioner ? "PENDING" : "ACTIVE",
      isEmailVerified: false,

      // OTP
      verificationToken,
      verificationTokenExpiresAt: new Date(Date.now() + 10 * 60 * 1000),

      // METADATA
      createdAt: new Date(),
      lastLogin: null,
      previousLogin: null,
    };

    // Hanya PRACTITIONER yang punya facebookUrl
    if (isPractitioner) {
      newUser.facebookUrl = facebookUrl;
      newUser.approvalStatus = "PENDING";
    }

    await usersCollection.doc(userId).set(newUser);

    return res.status(201).json({
      success: true,
      message: isPractitioner
        ? "Registrasi berhasil. Menunggu verifikasi admin."
        : "Registrasi berhasil. Silakan verifikasi email.",
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      message: "Server internal sedang bermasalah",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email dan password anda tidak sesuai!",
      });
      // Check if email or password is empty
    } else if (email === "" || password === "") {
      return res.status(400).json({
        success: false,
        message: "Email dan password tidak boleh kosong!",
      });
    }

    const snapshot = await usersCollection
      .where("email", "==", email.toLowerCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: "Ooooppss! Email atau password anda salah",
      });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    // Validasi password after hashing
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Oooppss! Email atau password anda salah",
      });
    }

    // Generate token dan set cookie login
    generateTokenSetCookie(res, user);

    // Update last login time
    await usersCollection.doc(user.id).update({
      previousLogin: user.lastLogin || null,
      lastLogin: new Date(),
    });

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Yeeayy! Anda berhasil login",
    });
  } catch (error) {
    console.error("Error", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const logout = async (req, res) => {
  res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
  return res.status(200).json({
    success: true,
    message: "Anda berhasil keluar!",
  });
};

export const changePassword = async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Lengkapi data email, password lama, dan password baru!",
      });
    }

    const snapshot = await usersCollection
      .where("email", "==", email.toLowerCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan!",
      });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Password lama anda salah!",
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await usersCollection.doc(user.id).update({
      password: hashedNewPassword,
    });

    return res.status(200).json({
      success: true,
      message: "Password berhasil diubah!",
    });
  } catch (error) {
    console.error("Error", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server!",
    });
  }
};

export const verifyTokenOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email dan OTP wajib diisi",
      });
    }

    const snapshot = await usersCollection
      .where("email", "==", email.toLowerCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan",
      });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email sudah diverifikasi",
      });
    }

    // Cek OTP
    if (user.verificationToken !== otp) {
      return res.status(400).json({
        success: false,
        message: "Kode OTP tidak valid",
      });
    }

    // Cek expired
    if (user.verificationTokenExpiresAt.toDate() < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Kode OTP telah kedaluwarsa",
      });
    }

    // Update status user
    const updateData = {
      isEmailVerified: true,
      verificationToken: null,
      verificationTokenExpiresAt: null,
      updatedAt: new Date(),
    };

    await usersCollection.doc(userDoc.id).update(updateData);

    return res.status(200).json({
      success: true,
      message:
        user.role === "PRACTITIONER"
          ? "Email berhasil diverifikasi. Menunggu persetujuan admin."
          : "Email berhasil diverifikasi. Silakan login.",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Server internal sedang bermasalah",
    });
  }
};

export const resendTokenOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email wajib diisi",
      });
    }

    const snapshot = await usersCollection
      .where("email", "==", email.toLowerCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan",
      });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email sudah diverifikasi",
      });
    }

    // (Opsional) Rate limit sederhana (misal 60 detik)
    if (
      user.verificationTokenExpiresAt &&
      user.verificationTokenExpiresAt.toDate() >
        new Date(Date.now() - 60 * 1000)
    ) {
      return res.status(429).json({
        success: false,
        message: "Silakan tunggu 1 menit sebelum meminta OTP baru",
      });
    }

    // Generate OTP baru
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

    await usersCollection.doc(userDoc.id).update({
      verificationToken: newOtp,
      verificationTokenExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      updatedAt: new Date(),
    });

    /**
     * TODO:
     * Kirim OTP ke email user
     * sendOtpEmail(email, newOtp)
     */

    return res.status(200).json({
      success: true,
      message: "Kode OTP baru telah dikirim ke email Anda",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Server internal sedang bermasalah",
    });
  }
};
