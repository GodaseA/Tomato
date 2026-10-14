
import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";

export const getRestaurants = async (req, res, next) => {
  try {
    const { search = "", city = "" } = req.query;

    const filter = {
      status: "approved",
      isAcceptingOrders: true,
    };

    if (search.trim()) {
      filter.name = {
        $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
    }

    if (city.trim()) {
      filter["address.city"] = {
        $regex: city.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
    }

    const restaurants = await Restaurant.find(filter)
      .select("name description image address.city address.state")
      .sort({ name: 1 })
      .limit(50)
      .lean();

    res.status(200).json({
      count: restaurants.length,
      restaurants,
    });
  } catch (error) {
    next(error);
  }
};

export const getRestaurantMenu = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;

    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      status: "approved",
      isAcceptingOrders: true,
    })
      .select("name description image address.city address.state")
      .lean();

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found or currently unavailable.",
      });
    }

    const { category } = req.query;

    const filter = {
      restaurantId: restaurant._id,
      available: true,
    };

    if (typeof category === "string" && category.trim()) {
      filter.category = category.trim();
    }

    const menuItems = await MenuItem.find(filter)
      .select("name description price image category foodType preparationTime")
      .sort({ category: 1, name: 1 })
      .limit(100)
      .lean();

    res.status(200).json({
      restaurant,
      count: menuItems.length,
      menuItems,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid restaurant ID.",
      });
    }

    next(error);
  }
};
