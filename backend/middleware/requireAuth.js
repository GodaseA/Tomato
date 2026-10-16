
import User from "../models/User.js";

export const requireAuth = async (req, res, next) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({
        message: "Please log in to continue.",
      });
    }

    const user = await User.findById(req.session.userId)
      .select("_id name email role status isEmailVerified profileImage");

    if (!user || user.status !== "active") {
      return req.session.destroy(() => {
        res.clearCookie("fd.sid", { path: "/" });

        res.status(401).json({
          message: "Your session is invalid. Please log in again.",
        });
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const allowRoles = (...roles) => (req, res, next) => {

  if (!req.user || !roles.includes(req.user.role)) {
    console.log(`curr role is ${req.user.role},${roles}`)
    return res.status(403).json({
      message: "You are not authorized to access this resource.",
    });
  }
  next();
};
