import { sendEmail } from "../emails/emailService.js";
import {
  practitionerApprovedTemplate,
  practitionerRejectedTemplate,
} from "../emails/templates/otpEmailTemplate.js";
import { db } from "../firestore.js";
import crypto from "crypto";

const usersCollection = db.collection("users");

export const approvePractitioner = async (req, res) => {
  try {
    const { userId } = req.params;

    const userRef = usersCollection.doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    const user = userSnap.data();

    // validate role dan status approval
    if (user.role !== "PRACTITIONER") {
      return res.status(400).json({
        success: false,
        message: "Anda bukan user praktisi",
      });
    }

    // validate email verification
    if (!user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email praktisi anda belum diverifikasi",
      });
    }

    if (user.approvalStatus !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Pengajuan sudah diproses sebelumnya",
      });
    }

    // update status and approvalStatus
    await userRef.update({
      status: "ACTIVE",
      approvalStatus: "APPROVED",
      approvedAt: new Date(),
      approvedBy: req.user.userId,
    });

    // kirim email OTP ke practitioner
    await sendEmail({
      to: user.email,
      subject: "Akun Practitioner BeeVra Disetujui",
      html: practitionerApprovedTemplate({ name: user.name }),
    });

    return res.status(200).json({
      success: true,
      message: "Akun praktisi telah disetujui",
    });
  } catch (error) {
    console.error("Approve practitioner error:", error);
    return res.status(500).json({
      success: false,
      message: "Server internal sedang bermasalah",
    });
  }
};

export const rejectPractitioner = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak",
      });
    }

    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "Alasan penolakan wajib diisi (min. 5 karakter)",
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
    const reapplyToken = crypto.randomUUID();
    const expiredAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 jam

    if (user.role !== "PRACTITIONER") {
      return res.status(400).json({
        success: false,
        message: "User bukan practitioner",
      });
    }

    if (user.approvalStatus !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Pengajuan sudah diproses",
      });
    }

    await userRef.update({
      approvalStatus: "REJECTED",
      rejectionReason: reason,
      rejectedAt: new Date(),
      rejectedBy: req.user.userId,
      reapplyToken,
      reapplyTokenExpiredAt: expiredAt,
      updatedAt: new Date(),
    });

    await sendEmail({
      to: user.email,
      subject: "Pendaftaran Practitioner BeeVra Ditolak",
      html: practitionerRejectedTemplate({
        name: user.name,
        reason,
        // link reapply → frontend
        reapplyUrl: `${process.env.FRONTEND_URL}/reapply`,
      }),
    });

    return res.status(200).json({
      success: true,
      message: "Pengajuan practitioner berhasil ditolak",
    });
  } catch (error) {
    console.error("Reject Practitioner Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server internal sedang bermasalah",
    });
  }
};

export const inactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, note } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Alasan penonaktifan wajib diisi",
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

    const userData = userSnap.data();

    if (userData.role === "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Tidak dapat menonaktifkan SUPER_ADMIN",
      });
    }

    if (userData.status === "INACTIVE") {
      return res.status(400).json({
        success: false,
        message: "User sudah dalam status INACTIVE",
      });
    }

    await userRef.update({
      status: "INACTIVE",
      inactivatedAt: new Date(),
      inactivatedReason: reason,
      inactivatedNote: note || null,
    });

    // (Opsional tapi sangat disarankan)
    await db.collection("violation_logs").add({
      userId,
      userEmail: userData.email,
      role: userData.role,
      action: "INACTIVATE_USER",
      reason,
      note: note || null,
      actionBy: req.user.userId, // SUPER_ADMIN
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "User berhasil dinonaktifkan",
    });
  } catch (error) {
    console.error("Inactivate user error:", error);
    return res.status(500).json({
      success: false,
      message: "Server internal sedang bermasalah",
    });
  }
};

export const reactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { note } = req.body;

    const userRef = usersCollection.doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    const userData = userSnap.data();

    if (userData.role === "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Tidak dapat mengubah status SUPER_ADMIN",
      });
    }

    if (userData.status === "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "User sudah dalam status ACTIVE",
      });
    }

    // 🔄 Re-activate
    await userRef.update({
      status: "ACTIVE",
      reactivatedAt: new Date(),
      reactivatedNote: note || null,
    });

    // 🧾 Audit log
    await db.collection("violation_logs").add({
      userId,
      userEmail: userData.email,
      role: userData.role,
      action: "REACTIVATE_USER",
      note: note || null,
      actionBy: req.user.userId, // SUPER_ADMIN
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "User berhasil diaktifkan kembali",
    });
  } catch (error) {
    console.error("Reactivate user error:", error);
    return res.status(500).json({
      success: false,
      message: "Server internal sedang bermasalah",
    });
  }
};

// export const rejectPractitioner = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { reason } = req.body;

//     if (!reason) {
//       return res.status(400).json({
//         success: false,
//         message: "Alasan penolakan wajib diisi",
//       });
//     }

//     const userRef = usersCollection.doc(userId);
//     const userSnap = await userRef.get();

//     if (!userSnap.exists) {
//       return res.status(404).json({
//         success: false,
//         message: "User tidak ditemukan",
//       });
//     }

//     const user = userSnap.data();

//     if (user.role !== "PRACTITIONER") {
//       return res.status(400).json({
//         success: false,
//         message: "Anda bukan user praktisi",
//       });
//     }

//     if (user.approvalStatus !== "PENDING") {
//       return res.status(400).json({
//         success: false,
//         message: "Pengajuan sudah diproses sebelumnya",
//       });
//     }

//     await userRef.update({
//       status: "REJECTED",
//       approvalStatus: "REJECTED",
//       rejectedAt: new Date(),
//       rejectionReason: reason,
//       rejectedBy: req.user.id,
//     });

//     // kirim email penolakan ke practitioner
//     await sendEmail({
//       to: user.email,
//       subject: "Pendaftaran Practitioner BeeVra Ditolak",
//       html: practitionerRejectedTemplate({ name: user.name, reason }),
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Akun praktisi berhasil ditolak",
//     });
//   } catch (error) {
//     console.error("Reject Practitioner Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server internal sedang bermasalah",
//     });
//   }
// };
