import mongoose, { Schema } from "mongoose";
import { availableTaskStatus, taskStatus } from "../utils/constants.js";

const taskSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
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

    project:{
      type: Schema.Types.ObjectId,
      ref: "project",
      required: true
    },
    attatchments: {
      type: [
        {
          url: String,
          fileId: String,
          thumbnailUrl: String,
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
