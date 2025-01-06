import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.MONGODB_URI || !process.env.NODE_ENV) {
  console.error("Please set MONGODB_URI and NODE_ENV in your .env file");
  process.exit(1);
}

let uri;

if (process.env.NODE_ENV !== "test") {
  uri = process.env.MONGODB_URI;
} else {
  uri = process.env.MONGODB_URI_TEST;
}

mongoose
  .connect(uri)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

export default mongoose;
