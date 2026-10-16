import argon2 from "argon2";
import User from "../models/User.js";
 
const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
  phone: user.phone || "",
  profileImage: user.profileImage || "",
});

const regenerateSession = (req) =>
  new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) reject(error);
      else resolve();
    });
  });

const saveSession = (req) =>
  new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) reject(error);
      else resolve();
    });
  });

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.validatedBody;

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    const user = await User.create({
      name,
      email,
      passwordHash,
      // Public registration always creates a normal user.
      // Never accept a role from the request body.
      role: "user",
    });

    await regenerateSession(req);
    req.session.userId = user._id.toString();
    await saveSession(req);

    return res.status(201).json({
      message: "Registration successful.",
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody;

    const user = await User.findOne({ email }).select("+passwordHash");

    // Use the same error message for an unknown email or wrong password.
    if (!user || !(await argon2.verify(user.passwordHash, password))) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        message: "This account is not currently active.",
      });
    }

    // Regenerate the session to prevent session fixation.
    await regenerateSession(req);
    req.session.userId = user._id.toString();
    await saveSession(req);

    return res.status(200).json({
      message: "Login successful.",
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    if (!req.session) {
      return res.status(200).json({
        message: "Logged out successfully.",
      });
    }

    req.session.destroy((error) => {
      if (error) return next(error);

      res.clearCookie("fd.sid", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      return res.status(200).json({
        message: "Logged out successfully.",
      });
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = (req, res) => {
  return res.status(200).json({
    user: publicUser(req.user),
  });
};


export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.validatedBody;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { name, phone } },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User account not found." });
    }

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
};
