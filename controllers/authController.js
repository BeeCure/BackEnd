import bcrypt from "bcrypt";
import crypto from "crypto";
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

    const allowedRoles = ["USER", "PRACTITIONER", "SUPER_ADMIN"];
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
      data: {
        ...newUser,
        createdAt: undefined,
        password: undefined,
        verificationToken: undefined,
        verificationTokenExpiresAt: undefined,
      },
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
        message: "Email dan password anda wajib diisi!",
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

    // Email verification check
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Email anda belum terverifikasi. Silakan verifikasi terlebih dahulu.",
      });
    }

    // User status check
    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Akun anda belum aktif. Silakan hubungi admin.",
      });
    }

    // User Practitioner approval check
    if (user.role === "PRACTITIONER" && user.approvalStatus !== "APPROVED") {
      return res.status(403).json({
        success: false,
        message:
          "Akun praktisi anda belum disetujui. Silakan tunggu konfirmasi dari admin.",
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
      data: {
        role: user.role,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error", error);
    return res.status(500).json({
      success: false,
      message: "Server internal sedang bermasalah",
    });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Anda berhasil keluar!",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal logout. Server internal sedang bermasalah",
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
    const userRef = usersCollection.doc(userDoc.id);
    const user = userDoc.data();

    // check if email is already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email sudah terverifikasi",
      });
    }

    // validate OTP
    if (
      user.verificationToken !== otp ||
      !user.verificationTokenExpiresAt ||
      user.verificationTokenExpiresAt.toDate() < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP tidak valid atau sudah kedaluwarsa",
      });
    }

    // Update status user
    const updateData = {
      isEmailVerified: true,
      verificationToken: null,
      verificationTokenExpiresAt: null,
      updatedAt: new Date(),
    };

    // USER langsung aktif
    if (user.role === "USER") {
      updateData.status = "ACTIVE";
      updateData.approvalStatus = "APPROVED";
    }

    // PRACTITIONER tetap pending
    if (user.role === "PRACTITIONER") {
      updateData.status = "PENDING";
      updateData.approvalStatus = "PENDING";
    }

    await userRef.update(updateData);

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
    const email = req.body?.email;

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

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Password lama dan baru wajib diisi",
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

    const user = userSnap.data();

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Password lama anda salah",
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await userRef.update({
      password: hashed,
      passwordChangedAt: new Date(),
    });

    return res.json({
      success: true,
      message: "Password berhasil diperbarui",
    });
  } catch (error) {
    console.error("Error", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server!",
    });
  }
};

// export const forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;
//     if (!email) {
//       return res.status(400).json({
//         success: false,
//         message: "Email wajib diisi",
//       });
//     }

//     const snapshot = await db
//       .collection("users")
//       .where("email", "==", email)
//       .limit(1)
//       .get();

//     // SECURITY: jangan bocorkan apakah email ada
//     if (snapshot.empty) {
//       return res.json({
//         success: true,
//         message: "Jika email terdaftar, link reset akan dikirim",
//       });
//     }

//     const userDoc = snapshot.docs[0];
//     const userId = userDoc.id;

//     const resetToken = crypto.randomBytes(32).toString("hex");
//     const tokenHash = crypto
//       .createHash("sha256")
//       .update(resetToken)
//       .digest("hex");

//     const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 menit

//     await db.collection("users").doc(userId).update({
//       passwordReset: {
//         tokenHash,
//         expiresAt,
//       },
//     });

//     const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

//     // TODO: integrate email service
//     console.log("RESET PASSWORD LINK:", resetLink);

//     return res.json({
//       success: true,
//       message: "Jika email terdaftar, link reset akan dikirim",
//     });
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: "Gagal memproses forgot password",
//     });
//   }
// };

// export const resetPassword = async (req, res) => {
//   try {
//     const { token, newPassword } = req.body;

//     if (!token || !newPassword) {
//       return res.status(400).json({
//         success: false,
//         message: "Token dan password baru wajib diisi",
//       });
//     }

//     const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

//     const snapshot = await db
//       .collection("users")
//       .where("passwordReset.tokenHash", "==", tokenHash)
//       .limit(1)
//       .get();

//     if (snapshot.empty) {
//       return res.status(400).json({
//         success: false,
//         message: "Token tidak valid atau sudah kadaluarsa",
//       });
//     }

//     const userDoc = snapshot.docs[0];
//     const userData = userDoc.data();

//     if (userData.passwordReset.expiresAt.toDate() < new Date()) {
//       return res.status(400).json({
//         success: false,
//         message: "Token reset password telah kadaluarsa",
//       });
//     }

//     const hashedPassword = await bcrypt.hash(newPassword, 12);

//     await db.collection("users").doc(userDoc.id).update({
//       password: hashedPassword,
//       passwordReset: null,
//     });

//     return res.json({
//       success: true,
//       message: "Password berhasil diperbarui",
//     });
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: "Gagal reset password",
//     });
//   }
// };
