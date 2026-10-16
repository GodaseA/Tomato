import User from "../models/User.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";

export const uploadMenuImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Please select an image to upload." });
    const result = await uploadToCloudinary(req.file.buffer, "food-delivery/menu");
    return res.status(201).json(result);
  } catch (error) { next(error); }
};

export const uploadRestaurantImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Please select an image to upload." });
    const result = await uploadToCloudinary(req.file.buffer, "food-delivery/restaurants");
    return res.status(201).json(result);
  } catch (error) { next(error); }
};

export const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Please select an image to upload." });
    const result = await uploadToCloudinary(req.file.buffer, "food-delivery/profiles");
    const user = await User.findByIdAndUpdate(req.user._id, {
      $set: { profileImage: result.image, profileImagePublicId: result.imagePublicId },
    }, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: "User account not found." });
    return res.status(201).json({ ...result, user: { id: user._id, name: user.name, email: user.email, role: user.role, isEmailVerified: user.isEmailVerified, phone: user.phone || "", profileImage: user.profileImage || "" } });
  } catch (error) { next(error); }
};
