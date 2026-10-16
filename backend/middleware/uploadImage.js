import multer from "multer";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      const error = new Error("Only JPG, PNG, and WebP images are allowed.");
      error.status = 400;
      return callback(error);
    }
    callback(null, true);
  },
});

export default uploadImage;
