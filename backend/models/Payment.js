
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
      enum: ["INR"],
      required: true,
    },

    method: {
      type: String,
      enum: ["cod", "razorpay"],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "paid",
        "failed",
        "cancelled",
        "refunded",
      ],
      default: "pending",
      required: true,
      index: true,
    },

    razorpayOrderId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },

    razorpayPaymentId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },

    razorpaySignature: {
      type: String,
      select: false,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    failureReason: {
      type: String,
      maxlength: 500,
      default: "",
    },
  },
  { timestamps: true }
);

paymentSchema.index({ customerId: 1, createdAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
