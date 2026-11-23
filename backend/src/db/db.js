import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("mongoDB connected✅");
  } catch (error) {
    console.log("mongodb connection failed", error);
    process.exit(1);
  }
};
