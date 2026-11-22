import mongoose from "mongoose";
import { projectMember } from "../models/projectMember.model.js";
import { task } from "../models/task.model.js";
import { note } from "../models/note.model.js";
import { User } from "../models/user.model.js";
import { apiError } from "../utils/api-error.js";
import jwt from "jsonwebtoken";

export const verifyJWT = async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new apiError(401, "Unauthorized");
  }
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded?._id).select(
      "-password -emailVerificationToken -emailVerificationExpiry",
    );

    if (!user) {
      throw new apiError(401, "Token invalid");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new apiError(401, "Token invalid");
  }
};

export const validateProjectPermission = (role = []) => {
  return async (req, res, next) => {
    const { projectId } = req.params;

    if (!projectId) throw new apiError(400, "project not found");

    const projectDoc = await projectMember.findOne({
      project: new mongoose.Types.ObjectId(projectId),
      user: new mongoose.Types.ObjectId(req.user._id),
    });

    if (!projectDoc) throw new apiError(400, "project not found");

    const givenRole = projectDoc?.role;

    req.user.role = givenRole;

    if (!role.includes(givenRole))
      throw new apiError(
        403,
        "You do not have the authority to perform this action",
      );

    next();
  };
};

export const validateTaskPermission = (
  allowedRoles = [],
  { allowAssignee = false } = {},
) => {
  return async (req, res, next) => {
    const { projectId, taskId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(projectId) ||
      !mongoose.Types.ObjectId.isValid(taskId)
    ) {
      throw new apiError(400, "Invalid project ID or task ID");
    }

    const foundTask = await task.findOne({
      _id: new mongoose.Types.ObjectId(taskId),
      project: new mongoose.Types.ObjectId(projectId),
    });

    if (!foundTask) {
      throw new apiError(404, "Task not found in this project");
    }

    const hasRolePermission = allowedRoles.includes(req.user.role);
    const isAssignee =
      allowAssignee &&
      foundTask.assignedTo?.toString() === req.user._id.toString();

    if (!hasRolePermission && !isAssignee) {
      throw new apiError(
        403,
        "You do not have the authority to perform this action on this task",
      );
    }

    req.task = foundTask;
    next();
  };
};

export const validateNotePermission = (allowedRoles = []) => {
  return async (req, res, next) => {
    const { projectId, noteId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(projectId) ||
      !mongoose.Types.ObjectId.isValid(noteId)
    ) {
      throw new apiError(400, "Invalid project ID or note ID");
    }

    const foundNote = await note.findOne({
      _id: new mongoose.Types.ObjectId(noteId),
      project: new mongoose.Types.ObjectId(projectId),
    });

    if (!foundNote) {
      throw new apiError(404, "Note not found in this project");
    }

    const isOwner =
      foundNote.createdBy?.toString() === req.user._id.toString();
    const hasRolePermission = allowedRoles.includes(req.user.role);

    if (!isOwner && !hasRolePermission) {
      throw new apiError(
        403,
        "You do not have the authority to perform this action on this note",
      );
    }

    req.note = foundNote;
    next();
  };
};
