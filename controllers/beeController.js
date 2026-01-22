import { sendEmail } from "../emails/emailService.js";
import { speciesUpdatedTemplate } from "../emails/templates/speciesUpdateTemplate.js";
import { db, bucket } from "../firestore.js";
import { Timestamp } from "firebase-admin/firestore";

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
        message: "Nama, nama ilmiah, dan genus wajib diisi!!",
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
      bodyShape: await uploadImage(req.files.bodyShape[0], "body.png"),
      wingShape: await uploadImage(req.files.wingShape[0], "wing.png"),
      entranceShape: await uploadImage(
        req.files.entranceShape[0],
        "entrance.png",
      ),
      honeyPouchShape: await uploadImage(
        req.files.honeyPouchShape[0],
        "honey_pouch.png",
      ),
    };

    // ===== FIRESTORE DATA =====
    const data = {
      name,
      nameLowercase: name.toLowerCase(),
      scientificName,
      genus,
      subGenus: subGenus ?? null,
      discoverer: discoverer ?? null,
      discoveredYear: discoveredYear ? Number(discoveredYear) : null,
      distribution: distribution ?? null,

      images,

      status: "ACTIVE",
      createdBy: req.user.id,
      createdByName: req.user.name,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
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

    if (updateData.name) {
      updateData.nameLowercase = updateData.name.toLowerCase();
    }

    if (
      updateData.discoveredYear &&
      (!Number.isInteger(Number(updateData.discoveredYear)) ||
        updateData.discoveredYear > new Date().getFullYear())
    ) {
      return res.status(400).json({
        success: false,
        message: "Tahun ditemukan tidak valid",
      });
    }

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
        message: "Tidak ada data yang diupdate",
      });
    }

    updateData.updatedAt = Timestamp.now();

    // ===== CHANGE LOG =====
    const changes = generateChangeLog(oldData, updateData);

    await docRef.update(updateData);

    // ===== EMAIL SUPER ADMIN =====
    await sendEmail({
      to: process.env.SUPER_ADMIN_EMAIL,
      subject: "Perubahan Data Spesies Lebah",
      html: speciesUpdatedTemplate({
        adminName: "Super Admin",
        editorName: req.user.name,
        editorEmail: req.user.email,
        speciesName: oldData.name,
        changes,
        updatedAt: new Date().toLocaleString("id-ID"),
      }),
    });

    return res.status(200).json({
      success: true,
      message: "Data lebah berhasil diperbarui",
    });
  } catch (error) {
    console.error("Update species error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal memperbarui spesies",
    });
  }
};

// export const deleteSpecies = async (req, res) => {
//   try {
//     await speciesCollection.doc(req.params.id).update({
//       status: "DELETED",
//       updatedAt: Timestamp.now(),
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Spesies berhasil dihapus",
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Gagal menghapus spesies",
//     });
//   }
// };

export const getSpeciesList = async (req, res) => {
  try {
    const { search = "", status = "ACTIVE", page = 1, limit = 10 } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    let query = beeCollection
      .where("status", "==", status)
      .orderBy("nameLowercase");

    // ===== SEARCH =====
    if (search) {
      const keyword = search.toLowerCase();
      query = query.startAt(keyword).endAt(keyword + "\uf8ff");
    }

    // ===== PAGINATION (Firestore way) =====
    if (offset > 0) {
      const snapshot = await query.limit(offset).get();
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }
    }

    const dataSnap = await query.limit(limitNum).get();

    const data = dataSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({
      success: true,
      meta: {
        page: pageNum,
        limit: limitNum,
        total: data.length,
      },
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
