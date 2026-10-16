
import "dotenv/config";

import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import cors from "cors";
import helmet from "helmet";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import ownerRoutes from "./routes/ownerRoutes.js";
import adminRestaurantRoutes from "./routes/adminRestaurantRoutes.js";
import ownerMenuRoutes from "./routes/ownerMenuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import ownerOrderRoutes from "./routes/ownerOrderRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

import verifyOrigin from "./middleware/verifyOrigin.js";

const app = express();

const requiredEnv = [
  "MONGO_URI",
  "SESSION_SECRET",
  "CLIENT_URL",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`${key} is missing from server/.env`);
  }
}

if (
  process.env.NODE_ENV === "production" &&
  process.env.SESSION_SECRET.length < 32
) {
  throw new Error("SESSION_SECRET must be at least 32 characters.");
}

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: "10kb" }));

app.use(verifyOrigin);

app.use(
  session({
    name: "fd.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      ttl: 14 * 24 * 60 * 60,
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 14 * 24 * 60 * 60 * 1000,
      path: "/",
    },
  })
);

app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Food Delivery API is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/admin/restaurants", adminRestaurantRoutes);
app.use("/api/owner/menu", ownerMenuRoutes);
app.use("/api/owner/orders", ownerOrderRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/uploads", uploadRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((error, req, res, next) => {
  if (error?.name === "MulterError") {
    const message = error.code === "LIMIT_FILE_SIZE" ? "Image must be 5 MB or smaller." : "Unable to process the uploaded image.";
    return res.status(400).json({ message });
  }
  if (error?.status === 400) return res.status(400).json({ message: error.message });
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    message: "An unexpected server error occurred.",
  });
});

const PORT = process.env.PORT || 5000;

try {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
} catch (error) {
  console.error("Failed to start the server:", error.message);
  process.exit(1);
}
