import mongoose from "mongoose";
import { config } from "./index";

export async function connectMongo(): Promise<void> {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}
