import "dotenv/config";
import app from "./app.js";
import dbconnectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await dbconnectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
     console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

start();
