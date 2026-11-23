import mongoose, { Schema } from "mongoose";
import {
  availableMemberStatus,
  availableUsers,
  memberStatusEnum,
  userRolesEnum,
} from "../utils/constants.js";

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
      enum: availableUsers,
      required: true,
      default: userRolesEnum.MEMBER,
    },
    status: {
      type: String,
      enum: availableMemberStatus,
      required: true,
      default: memberStatusEnum.PENDING,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
  },
  { timestamps: true },
);

export const projectMember =
  mongoose.models.projectMember || mongoose.model("projectMember", projectMemberSchema);
