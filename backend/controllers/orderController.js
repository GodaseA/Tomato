import mongoose from "mongoose";
import { z } from "zod";
import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";

const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

export const createCustomerOrder = async (req, res, next) => {
  let createdOrder = null;

  try {
    const parsed = z.object({
      restaurantId: z.string().refine(mongoose.isValidObjectId, "Invalid restaurant ID."),
      items: z.array(z.object({
        menuItemId: z.string().refine(mongoose.isValidObjectId, "Invalid menu item ID."),
        quantity: z.number().int().min(1).max(100),
      }).strict()).min(1).max(50),
      deliveryAddress: z.object({
        recipientName: z.string().trim().min(1).max(100),
        phone: z.string().trim().min(7).max(20),
        street: z.string().trim().min(1).max(200),
        city: z.string().trim().min(1).max(100),
        state: z.string().trim().min(1).max(100),
        postalCode: z.string().trim().min(4).max(12),
        deliveryInstructions: z.string().trim().max(500).optional().default(""),
      }).strict(),
      paymentMethod: z.literal("cod"),
    }).strict().safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid checkout data. Online payment is not enabled yet.",
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const { restaurantId, items, deliveryAddress } = parsed.data;
    const duplicateIds = new Set();
    for (const item of items) {
      if (duplicateIds.has(item.menuItemId)) {
        return res.status(400).json({ message: "Each menu item must appear only once in the cart." });
      }
      duplicateIds.add(item.menuItemId);
    }

    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      status: "approved",
      isAcceptingOrders: true,
    }).select("_id name");

    if (!restaurant) {
      return res.status(400).json({ message: "This restaurant is not currently accepting orders." });
    }

    const menuItemIds = items.map((item) => item.menuItemId);
    const menuItems = await MenuItem.find({
      _id: { $in: menuItemIds },
      restaurantId: restaurant._id,
      available: true,
    }).select("_id name price");

    if (menuItems.length !== items.length) {
      return res.status(400).json({
        message: "One or more items are unavailable or no longer belong to this restaurant. Please refresh your cart.",
      });
    }

    const menuById = new Map(menuItems.map((item) => [item._id.toString(), item]));
    const orderItems = items.map(({ menuItemId, quantity }) => {
      const menuItem = menuById.get(menuItemId);
      return {
        menuItemId: menuItem._id,
        name: menuItem.name,
        unitPrice: menuItem.price,
        quantity,
      };
    });

    const subtotal = roundMoney(orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
    const deliveryFee = subtotal >= 499 ? 0 : 40;
    const tax = roundMoney(subtotal * 0.05);
    const discount = 0;
    const total = roundMoney(subtotal + deliveryFee + tax - discount);

    createdOrder = await Order.create({
      customerId: req.user._id,
      restaurantId: restaurant._id,
      items: orderItems,
      deliveryAddress,
      subtotal,
      deliveryFee,
      tax,
      discount,
      total,
      paymentMethod: "cod",
      status: "pending",
    });

    await Payment.create({
      orderId: createdOrder._id,
      customerId: req.user._id,
      amount: total,
      currency: "INR",
      method: "cod",
      status: "pending",
    });

    return res.status(201).json({
      message: "Order placed successfully.",
      order: {
        _id: createdOrder._id,
        restaurantId: createdOrder.restaurantId,
        items: createdOrder.items,
        subtotal: createdOrder.subtotal,
        deliveryFee: createdOrder.deliveryFee,
        tax: createdOrder.tax,
        discount: createdOrder.discount,
        total: createdOrder.total,
        status: createdOrder.status,
        paymentMethod: createdOrder.paymentMethod,
        createdAt: createdOrder.createdAt,
      },
    });
  } catch (error) {
    if (createdOrder?._id) {
      await Order.deleteOne({ _id: createdOrder._id }).catch(() => {});
    }
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customerId: req.user._id })
      .populate("restaurantId", "name image address.city address.state")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const orderIds = orders.map((order) => order._id);
    const payments = await Payment.find({ orderId: { $in: orderIds } })
      .select("orderId amount currency method status paidAt")
      .lean();
    const paymentByOrder = new Map(payments.map((payment) => [payment.orderId.toString(), payment]));

    return res.json({
      count: orders.length,
      orders: orders.map((order) => ({
        ...order,
        payment: paymentByOrder.get(order._id.toString()) || null,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrderById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.orderId)) {
      return res.status(400).json({ message: "Invalid order ID." });
    }

    const order = await Order.findOne({
      _id: req.params.orderId,
      customerId: req.user._id,
    }).populate("restaurantId", "name image address.city address.state").lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const payment = await Payment.findOne({ orderId: order._id })
      .select("orderId amount currency method status paidAt")
      .lean();

    return res.json({ order: { ...order, payment: payment || null } });
  } catch (error) {
    next(error);
  }
};
