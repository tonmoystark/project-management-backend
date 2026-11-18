import { apiError } from "../utils/api-error";
import { apiResponse } from "../utils/api-response";
import { asyncHandler } from "../utils/async-handler";
import { project } from "../models/project.model.js";
import mongoose from "mongoose";
import { availableUsers, userRolesEnum } from "../utils/constants.js";
import { task } from "../models/task.model.js";

const getTasks = asyncHandler(async (res, req) => {
  const { projectId } = req.params;

  if (!project) throw new apiError(400, "project not found");

  const tasks = await task
    .find({
      project: mongoose.Types.ObjectId(projectId),
    })
    .populate("assignedTo", "username, avatar, fullname");

  return res.status(200).json(new apiResponse(200, tasks, "tasks fetched"));
});
const getTaskId = asyncHandler(async (res, req) => {});
const createTask = asyncHandler(async (res, req) => {
  const { name, content, status, assignedTo, assignedBy } = req.body;
  const { projectId } = req.params;

  const project = await project.findById(projectId);

  if (!project) throw new apiError(400, "project not found");
  const files = req.files || [];

  const attatchments = files.map((file) => {
    return {
      url: `${process.env.SERVER_URL}/images/${file.originalname}`,
      mimetype: file.mimetype,
      size: file.size,
    };
  });

  const task = await task.create({
    name,
    content,
    assignedTo: assignedTo ? mongoose.Types.ObjectId(assignedTo) : undefined,
    assignedBy: mongoose.Types.ObjectId(req.user._id),
    project: mongoose.Types.ObjectId(projectId),
    status,
    attatchments,
  });

  return res.status(201).json(new apiResponse(201, task, "new task created"));
});

const updateTask = asyncHandler(async (res, req) => {});
const deleteTask = asyncHandler(async (res, req) => {});
const createSubTask = asyncHandler(async (res, req) => {});
const updateSubTask = asyncHandler(async (res, req) => {});
const deleteSubTask = asyncHandler(async (res, req) => {});

export {
  getTasks,
  getTaskId,
  createTask,
  updateTask,
  deleteTask,
  createSubTask,
  updateSubTask,
  deleteSubTask,
};
