import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // User's full name
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    // Email used for login
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    // Store the hashed password, never the plain password
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    // Account type

    role: {
      type: String,
      enum: ["user", "restaurant", "admin"],
      default: "user",
      required: true,
    },
    // Account access status
    status: {
      type: String,
      enum: ["active", "pending", "suspended"],
      default: "active",
      required: true,
    },

    // Email verification
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    // Optional phone number
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
