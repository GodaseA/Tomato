import cloudinary from "../config/cloudinary.js";

export const uploadToCloudinary = (buffer, folder) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    { folder, resource_type: "image", transformation: [{ width: 1600, height: 1600, crop: "limit" }] },
    (error, result) => {
      if (error) return reject(error);
      resolve({ image: result.secure_url, imagePublicId: result.public_id });
    }
  );
  stream.end(buffer);
});
