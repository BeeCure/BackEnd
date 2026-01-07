import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("File harus berupa gambar"), false);
    }
    cb(null, true);
  },
});

export const uploadAvatar = upload.single("avatar");
