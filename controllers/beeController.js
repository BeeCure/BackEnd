import { sendEmail } from "../emails/emailService.js";
import { speciesUpdatedTemplate } from "../emails/templates/speciesUpdateTemplate.js";
import { db, bucket } from "../firestore.js";
import { Timestamp } from "firebase-admin/firestore";
import { generateSearchKeywords } from "../utils/generateSearchKeyword.js";
import { generateChangeLog } from "../utils/generateChangeLog.js";

const beeCollection = db.collection("bee_species");

export const createSpecies = async (req, res) => {
  try {
    const {
      name,
      scientificName,
      genus,
      subGenus,
      discoverer,
      discoveredYear,
      distribution,
    } = req.body;

    if (!name || !scientificName || !genus) {
      return res.status(400).json({
        success: false,
        message: "Nama spesies, nama ilmiah, dan genus wajib diisi!!",
      });
    }

    if (
      discoveredYear &&
      (!Number.isInteger(Number(discoveredYear)) ||
        discoveredYear < 0 ||
        discoveredYear > new Date().getFullYear())
    ) {
      return res.status(400).json({
        success: false,
        message: "Tahun ditemukan tidak valid",
      });
    }

    // ===== VALIDASI GAMBAR =====
    const requiredImages = [
      "bodyShape",
      "wingShape",
      "entranceShape",
      "honeyPouchShape",
    ];

    for (const field of requiredImages) {
      if (!req.files?.[field]) {
        return res.status(400).json({
          success: false,
          message: `Gambar ${field} wajib diunggah`,
        });
      }
    }

    const docRef = beeCollection.doc();

    // ===== UPLOAD KE STORAGE =====
    const uploadImage = async (file, filename) => {
      const ext = file.mimetype.split("/")[1];
      const filePath = `species/${docRef.id}/${filename}.${ext}`;
      const storageFile = bucket.file(filePath);

      await storageFile.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          cacheControl: "public, max-age=31536000",
        },
        public: true,
      });

      return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    };

    const images = {
      bodyShape: await uploadImage(req.files.bodyShape[0], "body"),
      wingShape: await uploadImage(req.files.wingShape[0], "wing"),
      entranceShape: await uploadImage(req.files.entranceShape[0], "entrance"),
      honeyPouchShape: await uploadImage(
        req.files.honeyPouchShape[0],
        "honey_pouch",
      ),
    };

    const searchKeywords = [
      ...generateSearchKeywords(name),
      ...generateSearchKeywords(scientificName),
      ...generateSearchKeywords(genus),
    ];

    const data = {
      name,
      nameLowercase: name.toLowerCase(),
      scientificName,
      genus: genus ?? null,
      subGenus: subGenus ?? null,
      discoverer: discoverer ?? null,
      discoveredYear: discoveredYear ? Number(discoveredYear) : null,
      distribution: distribution ?? null,

      images,

      status: "ACTIVE",
      createdBy: req.user.userId,
      createdByName: req.user.name,
      createdAt: Timestamp.now(),
    };

    await docRef.set(data);

    return res.status(201).json({
      success: true,
      message: "Spesies lebah berhasil ditambahkan",
      data: {
        id: docRef.id,
        ...data,
      },
    });
  } catch (error) {
    console.error("Create species error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal menambahkan spesies lebah",
    });
  }
};

export const getSpeciesList = async (req, res) => {
  try {
    const { search = "", status = "ACTIVE", limit = 10 } = req.query;

    let query = beeCollection.where("status", "==", status);

    if (search) {
      query = query.where(
        "searchKeywords",
        "array-contains",
        search.toLowerCase(),
      );
    }

    const snap = await query.limit(Number(limit)).get();

    const data = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({
      success: true,
      message: "Berhasil mengambil data spesies lebah",
      total: data.length,
      data,
    });
  } catch (error) {
    console.error("Get species list error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data spesies lebah",
    });
  }
};

export const getSpeciesDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const docRef = beeCollection.doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({
        success: false,
        message: "Spesies lebah tidak ditemukan",
      });
    }

    const data = docSnap.data();

    return res.status(200).json({
      success: true,
      message: "Berhasil mengambil data spesies lebah",
      data: {
        id: docSnap.id,
        ...data,
      },
    });
  } catch (error) {
    console.error("Get species detail error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil detail spesies lebah",
    });
  }
};

export const updateSpecies = async (req, res) => {
  try {
    const { id } = req.params;

    const docRef = beeCollection.doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({
        success: false,
        message: "Spesies lebah tidak ditemukan",
      });
    }

    const oldData = docSnap.data();
    const updateData = {};

    const allowedFields = [
      "name",
      "scientificName",
      "genus",
      "subGenus",
      "discoverer",
      "discoveredYear",
      "distribution",
      "status",
    ];

    // ===== TEXT UPDATE =====
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const name = updateData.name ?? oldData.name;
    const scientificName = updateData.scientificName ?? oldData.scientificName;
    const genus = updateData.genus ?? oldData.genus;
    const subGenus = updateData.subGenus ?? oldData.subGenus;

    updateData.searchKeywords = generateSearchKeywords({
      name,
      scientificName,
      genus,
      subGenus,
    });

    // ===== IMAGE UPDATE =====
    if (req.files) {
      const uploadImage = async (file, field) => {
        const ext = file.mimetype.split("/")[1];
        const filePath = `species/${id}/${field}.${ext}`;
        const storageFile = bucket.file(filePath);

        await storageFile.save(file.buffer, {
          metadata: {
            contentType: file.mimetype,
            cacheControl: "public, max-age=31536000",
          },
          public: true,
        });

        return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
      };

      const imageFields = [
        "bodyShape",
        "wingShape",
        "entranceShape",
        "honeyPouchShape",
      ];

      for (const field of imageFields) {
        if (req.files[field]) {
          updateData[`images.${field}`] = await uploadImage(
            req.files[field][0],
            field,
          );
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Tidak ada data yang diperbarui",
      });
    }

    // ===== TIMESTAMP =====
    updateData.updatedAt = Timestamp.now();

    // ===== CHANGE LOG =====
    const changes = generateChangeLog(oldData, updateData, ["searchKeywords"]);

    // ===== UPDATE FIRESTORE =====
    await docRef.update({
      ...updateData,
      updatedBy: req.user.userId,
    });

    // ===== SEND EMAIL TO SUPER ADMIN =====
    const updatedAtDate = updateData.updatedAt?.toDate?.() ?? new Date();

    await sendEmail({
      to: process.env.SUPER_ADMIN_EMAIL,
      subject: "Perubahan Data Spesies Lebah",
      html: speciesUpdatedTemplate({
        adminName: "Super Admin",
        editorName: req.user.name,
        editorEmail: req.user.email,
        speciesName: oldData.name,
        changes,
        updatedAt: updatedAtDate.toLocaleString("id-ID"),
      }),
    });

    return res.status(200).json({
      success: true,
      message: "Data lebah berhasil diperbarui",
      data: {
        ...updateData,
      },
    });
  } catch (error) {
    console.error("Update species error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal memperbarui spesies",
    });
  }
};

export const deleteSpecies = async (req, res) => {
  try {
    // ===== ROLE CHECK =====
    // if (req.user.role !== "SUPER_ADMIN") {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Hanya SUPER_ADMIN yang dapat menghapus spesies",
    //   });
    // }

    const { id } = req.params;
    const { reason } = req.body;

    const docRef = beeCollection.doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({
        success: false,
        message: "Spesies lebah tidak ditemukan",
      });
    }

    const species = docSnap.data();

    if (species.status === "INACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Spesies sudah dinonaktifkan",
      });
    }

    await docRef.update({
      status: "INACTIVE",
      deletedAt: Timestamp.now(),
      deletedBy: req.user.userId,
      deleteReason: reason ?? null,
      updatedAt: Timestamp.now(),
    });

    return res.status(200).json({
      success: true,
      message: "Spesies lebah berhasil dinonaktifkan",
    });
  } catch (error) {
    console.error("Delete species error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal menghapus spesies lebah",
    });
  }
};
