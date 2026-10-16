
import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    // Restaurant that owns this food item
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    // Food item details
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    // Price in Indian rupees
    price: {
      type: Number,
      required: true,
      min: 0.01,
    },

    // Food image URL
    image: {
      type: String,
      default: "",
    },

    imagePublicId: { type: String, default: "" },

    // Example: Pizza, Burger, Biryani
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    // Vegetarian or non-vegetarian
    foodType: {
      type: String,
      enum: ["vegetarian", "non-vegetarian", "vegan"],
      default: "vegetarian",
    },

    // Whether customers can order this item
    available: {
      type: Boolean,
      default: true,
    },

    // Optional preparation time in minutes
    preparationTime: {
      type: Number,
      min: 1,
      max: 240,
      default: 20,
    },
  },
  {
    timestamps: true,
  }
);

// Helpful when retrieving a restaurant's menu
menuItemSchema.index({ restaurantId: 1, available: 1 });

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

export default MenuItem;
