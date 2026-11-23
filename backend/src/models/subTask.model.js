import mongoose, { Schema } from "mongoose";

const subTaskSchema = new mongoose.Schema(
  {
    title: {
      required: true,
      trim: true,
      type: String,
    },
    content: {
      required: true,
      type: String,
      trim: true,
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: "task",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const subTask =
  mongoose.models.subTask || mongoose.model("subTask", subTaskSchema);
