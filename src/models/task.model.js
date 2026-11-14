import mongoose, { Schema } from "mongoose";
import { availableTaskStatus, taskStatus } from "../utils/constants";

const taskSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
      trim: true,
    },
    content: {
      type: String,
      trim: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
    status: {
      type: String,
      enum: availableTaskStatus,
      default: taskStatus.TODO,
    },
    attatchments: {
      type: [
        {
          url: String,
          MimeType: String,
          size: Number,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export const task = mongoose.models.task || mongoose.model("task", taskSchema);
