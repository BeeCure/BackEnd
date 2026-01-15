import { sendEmail } from "../emails/emailService.js";
import {
  practitionerApprovedTemplate,
  practitionerRejectedTemplate,
} from "../emails/templates/otpEmailTemplate.js";
import { db } from "../firestore.js";

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
      approvedBy: req.user.id,
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
    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Alasan penolakan wajib diisi",
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

    if (user.role !== "PRACTITIONER") {
      return res.status(400).json({
        success: false,
        message: "Anda bukan user praktisi",
      });
    }

    if (user.approvalStatus !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Pengajuan sudah diproses sebelumnya",
      });
    }

    await userRef.update({
      status: "REJECTED",
      approvalStatus: "REJECTED",
      rejectedAt: new Date(),
      rejectionReason: reason,
      rejectedBy: req.user.userId,
    });

    // kirim email penolakan ke practitioner
    await sendEmail({
      to: user.email,
      subject: "Pendaftaran Practitioner BeeVra Ditolak",
      html: practitionerRejectedTemplate({ name: user.name, reason }),
    });

    return res.status(200).json({
      success: true,
      message: "Akun praktisi berhasil ditolak",
    });
  } catch (error) {
    console.error("Reject Practitioner Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server internal sedang bermasalah",
    });
  }
};
