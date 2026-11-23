import { apiError } from "../utils/api-error.js";
import { apiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { project } from "../models/project.model.js";
import mongoose from "mongoose";
import { availableUsers, userRolesEnum } from "../utils/constants.js";
import { task } from "../models/task.model.js";
import { subTask } from "../models/subTask.model.js";

const getTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const existingProject = await project.findById(projectId);
  if (!existingProject) throw new apiError(404, "project not found");

  const tasks = await task
    .find({
      project: new mongoose.Types.ObjectId(projectId),
    })
    .populate("assignedTo", "username avatar fullName");

  return res.status(200).json(new apiResponse(200, tasks, "tasks fetched"));
});
const getTaskId = asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  const foundTask = await task.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(taskId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "assignedTo",
        foreignField: "_id",
        as: "assignedTo",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "subtasks",
        localField: "_id",
        foreignField: "task",
        as: "subTasks",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "createdBy",
              foreignField: "_id",
              as: "createdBy",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              createdBy: {
                $arrayElemAt: ["$createdBy", 0],
              },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        assignedTo: {
          $arrayElemAt: ["$assignedTo", 0],
        },
      },
    },
  ]);

  if (!foundTask || foundTask.length === 0) {
    throw new apiError(404, "task not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, foundTask[0], "task fetched successfully"));
});

const createTask = asyncHandler(async (req, res) => {
  const { name, content, status, assignedTo } = req.body;
  const { projectId } = req.params;

  const foundProject = await project.findById(projectId);

  if (!foundProject) throw new apiError(400, "project not found");
  const files = req.files || [];

  const baseUrl =
    process.env.SERVER_URL?.replace(/\/+$/, "") ||
    `${req.protocol}://${req.get("host")}`;

  const attatchments = files.map((file) => {
    return {
      url: `${baseUrl}/images/${encodeURIComponent(file.filename)}`,
      MimeType: file.mimetype,
      size: file.size,
    };
  });

  const newTask = await task.create({
    name,
    content,
    assignedTo: assignedTo
      ? new mongoose.Types.ObjectId(assignedTo)
      : undefined,
    assignedBy: new mongoose.Types.ObjectId(req.user._id),
    project: new mongoose.Types.ObjectId(projectId),
    status,
    attatchments,
  });

  return res
    .status(201)
    .json(new apiResponse(201, newTask, "new task created"));
});

const updateTask = asyncHandler(async (req, res) => {
  const { name, content, status, assignedTo } = req.body;
  const { taskId, projectId } = req.params;

  const existingProject = await project.findById(projectId);
  if (!existingProject) throw new apiError(404, "Project not found");

  const baseUrl =
    process.env.SERVER_URL?.replace(/\/+$/, "") ||
    `${req.protocol}://${req.get("host")}`;

  const files = req.files || [];
  const newAttachments = files.map((file) => {
    return {
      url: `${baseUrl}/images/${encodeURIComponent(file.filename)}`,
      MimeType: file.mimetype,
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
    .populate("assignedTo", "username avatar fullName");

  if (!updatedTask) throw new apiError(404, "Task not found in this project");

  return res
    .status(200)
    .json(new apiResponse(200, updatedTask, "Task updated successfully"));
});

const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { taskId, projectId } = req.params;

  const updatedTask = await task
    .findOneAndUpdate(
      { _id: taskId, project: projectId },
      { $set: { status } },
      { new: true, runValidators: true },
    )
    .populate("assignedTo", "username avatar fullName");

  if (!updatedTask) throw new apiError(404, "Task not found in this project");

  return res
    .status(200)
    .json(
      new apiResponse(200, updatedTask, "Task status updated successfully"),
    );
});

const deleteTask = asyncHandler(async (req, res) => {
  const { taskId, projectId } = req.params;

  const existingProject = await project.findById(projectId);
  if (!existingProject) throw new apiError(404, "project not found");

  await task.findOneAndDelete({
    _id: taskId,
    project: projectId,
  });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "task deleted successfully"));
});

const getSubTask = asyncHandler(async (req, res) => {
  const { taskId, projectId } = req.params;

  const foundTask = await task.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(taskId),
        project: new mongoose.Types.ObjectId(projectId),
      },
    },
    {
      $lookup: {
        from: "subtasks",
        localField: "_id",
        foreignField: "task",
        as: "subTasks",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "createdBy",
              foreignField: "_id",
              as: "createdBy",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              createdBy: {
                $arrayElemAt: ["$createdBy", 0],
              },
            },
          },
        ],
      },
    },
    {
      $project: {
        subTasks: 1,
      },
    },
  ]);

  if (!foundTask || foundTask.length === 0) {
    throw new apiError(404, "task not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, foundTask[0], "subtask fetched successfully"));
});

const createSubTask = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  const { taskId, projectId } = req.params;

  const foundProject = await project.findById(projectId);
  if (!foundProject) throw new apiError(404, "project not found");

  const foundTask = await task.findOne({
    _id: new mongoose.Types.ObjectId(taskId),
    project: new mongoose.Types.ObjectId(projectId),
  });
  if (!foundTask) throw new apiError(404, "task not found");

  const createdSubTask = await subTask.create({
    title,
    content,
    task: new mongoose.Types.ObjectId(taskId),
  });

  return res
    .status(201)
    .json(
      new apiResponse(201, createdSubTask, "subtask created successfully."),
    );
});
const updateSubTask = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  const { taskId, subTaskId } = req.params;

  const updateFields = {};
  if (title !== undefined) updateFields.title = title;
  if (content !== undefined) updateFields.content = content;

  const updatedSubTask = await subTask.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(subTaskId),
      task: new mongoose.Types.ObjectId(taskId),
    },
    { $set: updateFields },
    { new: true },
  );

  if (!updatedSubTask) throw new apiError(404, "subtask not found");

  return res
    .status(200)
    .json(
      new apiResponse(200, updatedSubTask, "sub task updated successfully"),
    );
});
const deleteSubTask = asyncHandler(async (req, res) => {
  const { taskId, subTaskId } = req.params;

  const foundSubTask = await subTask.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(subTaskId),
    task: new mongoose.Types.ObjectId(taskId),
  });

  if (!foundSubTask) throw new apiError(404, "subTask not found");
  return res
    .status(200)
    .json(new apiResponse(200, {}, "subtask deleted successfully"));
});

export {
  getTasks,
  getTaskId,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getSubTask,
  createSubTask,
  updateSubTask,
  deleteSubTask,
};
