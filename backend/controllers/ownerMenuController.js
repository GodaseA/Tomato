
import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";

const menuItemFields = (body) => ({
  name: body.name,
  description: body.description || "",
  price: body.price,
  image: body.image || "",
  category: body.category,
  foodType: body.foodType || "vegetarian",
  available: body.available ?? true,
  preparationTime: body.preparationTime ?? 20,
});

const getOwnedRestaurant = async (userId) => {
  return Restaurant.findOne({ ownerId: userId }).sort({ createdAt: -1 });
};

export const getOwnerMenu = async (req, res, next) => {
  try {
    const restaurant = await getOwnedRestaurant(req.user._id);

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant application not found.",
      });
    }

    const menuItems = await MenuItem.find({
      restaurantId: restaurant._id,
    }).sort({ category: 1, name: 1 });

    res.json({ restaurant, menuItems });
  } catch (error) {
    next(error);
  }
};

export const createMenuItem = async (req, res, next) => {
  try {
    const restaurant = await getOwnedRestaurant(req.user._id);

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant application not found.",
      });
    }

    const menuItem = await MenuItem.create({
      restaurantId: restaurant._id,
      ...menuItemFields(req.validatedBody),
    });

    res.status(201).json({
      message: "Menu item added successfully.",
      menuItem,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMenuItem = async (req, res, next) => {
  try {
    const restaurant = await getOwnedRestaurant(req.user._id);

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant application not found.",
      });
    }

    const menuItem = await MenuItem.findOneAndUpdate(
      {
        _id: req.params.itemId,
        restaurantId: restaurant._id,
      },
      { $set: menuItemFields(req.validatedBody) },
      { new: true, runValidators: true }
    );

    if (!menuItem) {
      return res.status(404).json({
        message: "Menu item not found in your restaurant.",
      });
    }

    res.json({
      message: "Menu item updated successfully.",
      menuItem,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMenuItem = async (req, res, next) => {
  try {
    const restaurant = await getOwnedRestaurant(req.user._id);

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant application not found.",
      });
    }

    const menuItem = await MenuItem.findOneAndDelete({
      _id: req.params.itemId,
      restaurantId: restaurant._id,
    });

    if (!menuItem) {
      return res.status(404).json({
        message: "Menu item not found in your restaurant.",
      });
    }

    res.json({ message: "Menu item deleted successfully." });
  } catch (error) {
    next(error);
  }
};
