
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number between 1 and 5.",
      },
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    status: {
      type: String,
      enum: ["published", "hidden"],
      default: "published",
      required: true,
    },
  },
  { timestamps: true }
);

// One review per customer for each order
reviewSchema.index(
  { customerId: 1, orderId: 1 },
  { unique: true }
);

// Retrieve restaurant reviews efficiently
reviewSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
