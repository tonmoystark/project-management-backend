import mongoose, { Schema } from "mongoose";
import { avalableUsers, userRolesEnum } from "../utils/constants";

const projectMemberSchema = new mongoose.Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "project",
      required: true,
    },
    role: {
      type: String,
      enum: avalableUsers,
      required: true,
      default: userRolesEnum.MEMBER,
    },
  },
  { timestamps: true },
);

export const projectMember =
  mongoose.models.projectMember || mongoose.model("projectMember", projectMemberSchema);
