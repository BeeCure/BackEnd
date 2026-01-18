import { db, bucket } from "../firestore.js";
import { Timestamp } from "firebase-admin/firestore";

const beeCollection = db.collection("bee_species");

export const createSpecies = async (req, res) => {
  try {
    const { name, localName, scientificName, description, habitat, behavior } =
      req.body;

    if (!name || !scientificName) {
      return res.status(400).json({
        success: false,
        message: "Nama dan nama ilmiah wajib diisi",
      });
    }

    const docRef = beeCollection.doc();

    const data = {
      name,
      localName: localName ?? null,
      scientificName,
      description: description ?? null,
      habitat: habitat ?? null,
      behavior: behavior ?? null,
      nameLowercase: name.toLowerCase(),
      status: "ACTIVE",
      createdBy: req.user.id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // ===== IMAGE =====
    if (req.file) {
      const filePath = `species/${docRef.id}.png`;
      const file = bucket.file(filePath);

      await file.save(req.file.buffer, {
        metadata: {
          contentType: "image/png",
          cacheControl: "public, max-age=31536000",
        },
        public: true,
      });

      data.imageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    }

    await docRef.set(data);

    return res.status(201).json({
      success: true,
      message: "Spesies lebah berhasil ditambahkan",
      data: { id: docRef.id, ...data },
    });
  } catch (error) {
    console.error("Create species error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal menambahkan spesies lebah",
    });
  }
};

export const getAllSpecies = async (req, res) => {
  try {
    let query = speciesCollection.where("status", "==", "ACTIVE");

    const { search } = req.query;

    if (search) {
      const keyword = search.toLowerCase();
      query = query
        .where("nameLowercase", ">=", keyword)
        .where("nameLowercase", "<=", keyword + "\uf8ff");
    }

    const snapshot = await query.get();

    const species = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({
      success: true,
      total: species.length,
      data: species,
    });
  } catch (error) {
    console.error("Get species error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data spesies",
    });
  }
};

export const getSpeciesById = async (req, res) => {
  try {
    const doc = await speciesCollection.doc(req.params.id).get();

    if (!doc.exists || doc.data().status === "DELETED") {
      return res.status(404).json({
        success: false,
        message: "Spesies tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      data: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil spesies",
    });
  }
};

export const updateSpecies = async (req, res) => {
  try {
    const docRef = speciesCollection.doc(req.params.id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({
        success: false,
        message: "Spesies tidak ditemukan",
      });
    }

    const updateData = {
      ...req.body,
      updatedAt: Timestamp.now(),
    };

    if (req.body.name) {
      updateData.nameLowercase = req.body.name.toLowerCase();
    }

    if (req.file) {
      const filePath = `species/${docRef.id}.png`;
      const file = bucket.file(filePath);

      await file.save(req.file.buffer, {
        metadata: {
          contentType: "image/png",
          cacheControl: "public, max-age=31536000",
        },
        public: true,
      });

      updateData.imageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    }

    await docRef.update(updateData);

    return res.status(200).json({
      success: true,
      message: "Spesies berhasil diperbarui",
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
    await speciesCollection.doc(req.params.id).update({
      status: "DELETED",
      updatedAt: Timestamp.now(),
    });

    return res.status(200).json({
      success: true,
      message: "Spesies berhasil dihapus",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal menghapus spesies",
    });
  }
};
