import mongoose from "mongoose";
import Restaurant from "../models/Restaurant.js";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";

const transitions = {
  pending: ["confirmed", "rejected"],
  confirmed: ["preparing"],
  preparing: ["ready_for_pickup"],
  ready_for_pickup: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
  rejected: [],
};

const getApprovedRestaurant = (userId) => Restaurant.findOne({ ownerId: userId, status: "approved" }).sort({ createdAt: -1 });

export const getOwnerOrders = async (req, res, next) => {
  try {
    const restaurant = await getApprovedRestaurant(req.user._id);
    if (!restaurant) return res.status(404).json({ message: "No approved restaurant found for your account." });

    const allowed = Object.keys(transitions);
    const filter = { restaurantId: restaurant._id };
    if (req.query.status) {
      if (!allowed.includes(req.query.status)) return res.status(400).json({ message: "Invalid order status filter." });
      filter.status = req.query.status;
    }

    const orders = await Order.find(filter).populate("customerId", "name email").sort({ createdAt: -1 }).limit(100).lean();
    const ids = orders.map((order) => order._id);
    const payments = await Payment.find({ orderId: { $in: ids } }).select("orderId amount currency method status paidAt").lean();
    const byOrder = new Map(payments.map((payment) => [String(payment.orderId), payment]));
    return res.json({ count: orders.length, orders: orders.map((order) => ({ ...order, payment: byOrder.get(String(order._id)) || null })) });
  } catch (error) { next(error); }
};

export const updateOwnerOrderStatus = async (req, res, next) => {
  try {
    const restaurant = await getApprovedRestaurant(req.user._id);
    if (!restaurant) return res.status(404).json({ message: "No approved restaurant found for your account." });
    if (!mongoose.isValidObjectId(req.params.orderId)) return res.status(400).json({ message: "Invalid order ID." });
    const order = await Order.findOne({ _id: req.params.orderId, restaurantId: restaurant._id });
    if (!order) return res.status(404).json({ message: "Order not found in your restaurant." });
    const nextStatuses = transitions[order.status] || [];
    if (!nextStatuses.includes(req.validatedBody.status)) return res.status(400).json({ message: `Cannot change order status from ${order.status} to ${req.validatedBody.status}.`, allowedNextStatuses: nextStatuses });
    order.status = req.validatedBody.status;
    await order.save();
    return res.json({ message: "Order status updated successfully.", order: { _id: order._id, status: order.status, updatedAt: order.updatedAt } });
  } catch (error) { next(error); }
};
