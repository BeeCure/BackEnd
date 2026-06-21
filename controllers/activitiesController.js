import { Timestamp } from "firebase-admin/firestore";
import { bucket, db } from "../firestore.js";
import { generateSearchKeywords } from "../utils/generateSearchKeyword.js";

const activityCollection = db.collection("activities");

const uploadCoverImage = async (file, activityId) => {
  const extension = file.mimetype.split("/")[1];
  const filePath = `activities/${activityId}/cover.${extension}`;
  const storageFile = bucket.file(filePath);
  await storageFile.save(file.buffer, {
    metadata: {
      contentType: file.mimetype,
      cacheControl: "public,max-age=31536000",
    },
    public: true,
  });
  return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
};

const deleteOldImage = async (imageUrl) => {
  try {
    if (!imageUrl) return;
    const prefix = `https://storage.googleapis.com/${bucket.name}/`;
    const filePath = imageUrl.replace(prefix, "");
    await bucket.file(filePath).delete({
      ignoreNotFound: true,
    });
  } catch (error) {
    console.error("Delete Image Error :", error.message);
  }
};

export const createActivity = async (req, res) => {
  try {
    const { title, description, location, activityDate } = req.body;
    if (!title || !description || !location || !activityDate) {
      return res.status(400).json({
        success: false,
        message: "Seluruh data kegiatan wajib diisi.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Foto kegiatan wajib diunggah.",
      });
    }

    const docRef = activityCollection.doc();
    const coverImage = await uploadCoverImage(req.file, docRef.id);
    const activityData = {
      title,
      description,
      location,
      activityDate: Timestamp.fromDate(new Date(activityDate)),
      coverImage,
      searchKeywords: generateSearchKeywords(title),
      status: "ACTIVE",
      createdBy: req.user.userId,
      createdByName: req.user.name,
      createdAt: Timestamp.now(),
    };
    await docRef.set(activityData);

    return res.status(201).json({
      success: true,
      message: "Kegiatan berhasil ditambahkan.",
      data: {
        id: docRef.id,
        ...activityData,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server.",
    });
  }
};

export const getActivityList = async (req, res) => {
  try {
    const { search = "", status = "ACTIVE", limit = 20 } = req.query;
    let query = activityCollection.where("status", "==", status);
    if (search) {
      query = query.where(
        "searchKeywords",
        "array-contains",
        search.toLowerCase(),
      );
    }
    const snapshot = await query
      .orderBy("activityDate", "desc")
      .limit(Number(limit))
      .get();

    const activities = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({
      success: true,
      message: "Berhasil mengambil data kegiatan",
      total: activities.length,
      data: activities,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server.",
    });
  }
};

export const getActivityDetail = async (req, res) => {
  try {
    const doc = await activityCollection.doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "Data kegiatan tidak ditemukan.",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Berhasil mengambil data kegiatan",
      data: {
        id: doc.id,
        ...doc.data(),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server.",
    });
  }
};

export const updateActivity = async (req, res) => {
  try {
    const activityRef = activityCollection.doc(req.params.id);
    const snapshot = await activityRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({
        success: false,
        message: "Data kegiatan tidak ditemukan.",
      });
    }

    const oldData = snapshot.data();
    let coverImage = oldData.coverImage;
    if (req.file) {
      await deleteOldImage(oldData.coverImage);
      coverImage = await uploadCoverImage(req.file, req.params.id);
    }

    const updateData = {
      title: req.body.title ?? oldData.title,
      description: req.body.description ?? oldData.description,
      location: req.body.location ?? oldData.location,
      activityDate: req.body.activityDate
        ? Timestamp.fromDate(new Date(req.body.activityDate))
        : oldData.activityDate,
      coverImage,
      searchKeywords: generateSearchKeywords(req.body.title ?? oldData.title),
      updatedBy: req.user.name,
      updatedAt: Timestamp.now(),
    };
    await activityRef.update(updateData);
    return res.status(200).json({
      success: true,
      message: "Data kegiatan berhasil diperbarui.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server.",
    });
  }
};

export const deleteActivity = async (req, res) => {
  try {
    const activityRef = activityCollection.doc(req.params.id);
    const snapshot = await activityRef.get();
    if (!snapshot.exists) {
      return res.status(404).json({
        success: false,
        message: "Data kegiatan tidak ditemukan.",
      });
    }
    await activityRef.update({
      status: "INACTIVE",
      updatedBy: req.user.name,
      updatedAt: Timestamp.now(),
    });

    return res.status(200).json({
      success: true,
      message: "Data kegiatan berhasil dihapus.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server.",
    });
  }
};
