import axios from "axios";
import FormData from "form-data";
import { bucket, db } from "../firestore.js";

export const classifyBee = async (req, res) => {
  try {
    const user = req.user;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Gambar lebah wajib diunggah",
      });
    }

    if (!req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({
        success: false,
        message: "File harus berupa gambar",
      });
    }

    const docRef = db.collection("classification_logs").doc();

    const ext = req.file.mimetype.split("/")[1];
    const filename = `classifications/${docRef.id}.${ext}`;
    const storageFile = bucket.file(filename);

    await storageFile.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
        cacheControl: "public, max-age=31536000",
      },
      public: true,
    });

    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    const form = new FormData();
    form.append("image", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    let aiRes;
    try {
      aiRes = await axios.post(`${process.env.BEE_MODEL_URL}/predict`, form, {
        headers: form.getHeaders(),
        timeout: 15000,
      });
    } catch (err) {
      console.error("AI SERVICE ERROR:", err?.response?.data || err);
      return res.status(503).json({
        success: false,
        message: "Layanan AI tidak tersedia",
      });
    }

    const aiData = aiRes?.data?.data;
    if (!aiData || !aiData.decision) {
      return res.status(500).json({
        success: false,
        message: "Response AI tidak valid",
      });
    }

    let status;
    let message;

    switch (aiData.decision) {
      case "OOC":
        status = "REJECTED";
        message = "Gambar bukan lebah";
        break;

      case "REVIEW":
        status = "PENDING_REVIEW";
        message = "Gambar perlu verifikasi manual";
        break;

      case "CONFIDENT":
        status = "APPROVED";
        message = "Klasifikasi berhasil";
        break;

      default:
        status = "ERROR";
        message = "Keputusan AI tidak valid";
    }

    await docRef.set({
      id: docRef.id,
      userId: user.userId,
      role: user.role,

      imageUrl,

      species: aiData.species ?? null,
      confidence: Number(aiData.confidence),
      similarity: Number(aiData.similarity),
      decision: aiData.decision,
      status,

      createdAt: new Date(),
    });

    return res.status(200).json({
      success: aiData.decision !== "OOC",
      message,
      data: {
        species: aiData.species,
        confidence: aiData.confidence,
        similarity: aiData.similarity,
        decision: aiData.decision,
        imageUrl,
      },
    });
  } catch (error) {
    console.error("Bee classification error:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal melakukan klasifikasi lebah",
    });
  }
};

export const getClassificationHistory = async (req, res) => {
  try {
    const user = req.user;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const status = req.query.status;

    let query = db
      .collection("classification_logs")
      .where("userId", "==", user.userId)
      .orderBy("createdAt", "desc");

    if (status) {
      query = query.where("status", "==", status);
    }

    const snapshot = await query
      .offset((page - 1) * limit)
      .limit(limit)
      .get();

    const histories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({
      success: true,
      message: "History klasifikasi berhasil diambil",
      meta: {
        page,
        limit,
        total: histories.length,
      },
      data: histories,
    });
  } catch (error) {
    console.error("Get classification history error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil history klasifikasi",
    });
  }
};

export const getClassificationHistoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID history tidak valid",
      });
    }

    const docRef = db.collection("classification_logs").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({
        success: false,
        message: "History klasifikasi tidak ditemukan",
      });
    }

    const data = docSnap.data();

    if (data.userId !== user.userId) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses ke data ini",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Detail history klasifikasi berhasil diambil",
      data: {
        id: docSnap.id,
        ...data,
      },
    });
  } catch (error) {
    console.error("Get classification history by id error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil detail history klasifikasi",
    });
  }
};
