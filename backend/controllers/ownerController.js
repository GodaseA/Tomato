import Restaurant from "../models/Restaurant.js";
import User from "../models/User.js";

export const applyForRestaurant = async (req, res, next) => {
  try {
    const { name, description, email, phone, address, image, imagePublicId } =
      req.validatedBody;

    const existing = await Restaurant.findOne({
      ownerId: req.user._id,
      status: { $in: ["pending", "approved", "suspended"] },
    });

    if (existing) {
      return res.status(409).json({
        message: "You already have an active restaurant application.",
        restaurant: existing,
      });
    }

    const restaurant = await Restaurant.create({
      ownerId: req.user._id,
      name,
      description,
      email,
      phone,
      address,
      image: image || "",
      imagePublicId: imagePublicId || "",
      status: "pending",
      isAcceptingOrders: false,
    });

    // await User.updateOne(
    //   { _id: req.user._id, role: "user" },
    //   { $set: { role: "restaurant" } }
    // );

    return res.status(201).json({
      message: "Restaurant application submitted for admin approval.",
      restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// update restorent info
export const editRestaurant = async (req, res, next) => {
  try {
    const { name, description, email, phone, address, image, imagePublicId } =
      req.validatedBody;

    // const existing = await Restaurant.findOne({ownerId: req.user._id});
console.log("begene to update");
    const existing = await Restaurant.findOneAndUpdate(
      {
        ownerId: req.user._id,
      },
      {
        name: name,
        description: description,
        email: email,
        phone: phone,
        address: address,
        image: image || "",
        imagePublicId: imagePublicId || "",
      },
    );

    if (!existing) {
      return res.status(409).json({
        message: "You don't have any restaurant.",
        // restaurant: existing,
      });
    }

    // await User.updateOne(
    //   { _id: req.user._id, role: "user" },
    //   { $set: { role: "restaurant" } }
    // );
    await existing.save();
    console.log("completion update");

    return res.status(201).json({
      message:
        "Restaurant Detail updation application submitted for admin approval.",
      existing,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({
      ownerId: req.user._id,
    }).sort({ createdAt: -1 });

    if (!restaurant) {
      return res.status(404).json({
        message: "No restaurant application found.",
      });
    }

    res.json({ restaurant });
  } catch (error) {
    next(error);
  }
};

export const updateRestaurantAvailability = async (req, res, next) => {
  try {
    const { isAcceptingOrders } = req.validatedBody;

    const restaurant = await Restaurant.findOne({
      ownerId: req.user._id,
      status: "approved",
    });

    if (!restaurant) {
      return res.status(403).json({
        message: "Only approved restaurant owners can change availability.",
      });
    }

    restaurant.isAcceptingOrders = isAcceptingOrders;
    await restaurant.save();

    res.json({
      message: "Restaurant availability updated.",
      restaurant,
    });
  } catch (error) {
    next(error);
  }
};
