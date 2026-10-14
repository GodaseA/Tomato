
import Restaurant from "../models/Restaurant.js";

export const getRestaurantApplications = async (req, res, next) => {
  try {
    const { status = "pending" } = req.query;

    const allowedStatuses = [
      "pending",
      "approved",
      "rejected",
      "suspended",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid restaurant status filter.",
      });
    }

    const restaurants = await Restaurant.find({ status })
      .populate("ownerId", "name email")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({
      count: restaurants.length,
      restaurants,
    });
  } catch (error) {
    next(error);
  }
};

export const reviewRestaurantApplication = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { decision, rejectionReason = "" } = req.validatedBody;

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found.",
      });
    }

    if (restaurant.status !== "pending") {
      return res.status(409).json({
        message: "This application has already been reviewed.",
      });
    }

    if (decision === "approve") {
      restaurant.status = "approved";
      restaurant.rejectionReason = "";
      // Approval does not automatically open the restaurant.
      restaurant.isAcceptingOrders = false;
    } else {
      restaurant.status = "rejected";
      restaurant.rejectionReason = rejectionReason;
      restaurant.isAcceptingOrders = false;
    }

    await restaurant.save();

    res.json({
      message:
        decision === "approve"
          ? "Restaurant approved successfully."
          : "Restaurant application rejected.",
      restaurant,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRestaurantStatus = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { status } = req.validatedBody;

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found.",
      });
    }

    restaurant.status = status;

    if (status !== "approved") {
      restaurant.isAcceptingOrders = false;
    }

    await restaurant.save();

    res.json({
      message: "Restaurant status updated.",
      restaurant,
    });
  } catch (error) {
    next(error);
  }
};
