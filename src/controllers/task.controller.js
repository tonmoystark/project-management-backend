import { apiError } from "../utils/api-error";
import { apiResponse } from "../utils/api-response";
import { asyncHandler } from "../utils/async-handler";
import { project } from "../models/project.model.js";
import mongoose from "mongoose";
import { availableUsers, userRolesEnum } from "../utils/constants.js";
import { task } from "../models/task.model.js";

const getTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!project) throw new apiError(400, "project not found");

  const tasks = await task
    .find({
      project: mongoose.Types.ObjectId(projectId),
    })
    .populate("assignedTo", "username, avatar, fullname");

  return res.status(200).json(new apiResponse(200, tasks, "tasks fetched"));
});
const getTaskId = asyncHandler(async (req, res) => {});

const createTask = asyncHandler(async (req, res) => {
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

const updateTask = asyncHandler(async (req, res) => {
  const { name, content, status, assignedTo } = req.body;
  const { taskId, projectId } = req.params;

  const existingProject = await project.findById(projectId);
  if (!existingProject) throw new apiError(404, "Project not found");

  const files = req.files || [];
  const newAttachments = files.map((file) => {
    return {
      url: `${process.env.SERVER_URL}/images/${file.originalname}`,
      mimetype: file.mimetype,
      size: file.size,
    };
  });

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (content !== undefined) updateData.content = content;
  if (status !== undefined) updateData.status = status;
  if (assignedTo !== undefined) {
    updateData.assignedTo = assignedTo
      ? new mongoose.Types.ObjectId(assignedTo)
      : null;
  }

  const updateQuery = { $set: updateData };
  if (newAttachments.length > 0) {
    updateQuery.$push = { attatchments: { $each: newAttachments } };
  }

  const updatedTask = await task
    .findOneAndUpdate({ _id: taskId, project: projectId }, updateQuery, {
      new: true,
    })
    .populate("assignedTo", "username avatar fullname");

  if (!updatedTask) throw new apiError(404, "Task not found in this project");

  return res
    .status(200)
    .json(new apiResponse(200, updatedTask, "Task updated successfully"));
});
const deleteTask = asyncHandler(async (req, res) => {
  const { taskId, projectId } = req.params;

  const existingProject = await project.findById(projectId);
  if (!existingProject) throw new apiError(404, "project not found");

  await task.findByIdAndDelete({
    _id: taskId,
    project: projectId,
  });

  return res.status(200);
  json(new apiResponse(200, {}, "task deleted successfully"));
});
const createSubTask = asyncHandler(async (req, res) => {});
const updateSubTask = asyncHandler(async (req, res) => {});
const deleteSubTask = asyncHandler(async (req, res) => {});

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
