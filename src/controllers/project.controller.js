import { apiError } from "../utils/api-error";
import { apiResponse } from "../utils/api-response";
import { asyncHandler } from "../utils/async-handler";
import { project, project } from "../models/project.model.js";
import { User } from "../models/user.model.js";
import { projectMember } from "../models/projectMember.model.js";
import mongoose from "mongoose";
import { userRolesEnum } from "../utils/constants.js";

const getProjects = asyncHandler(async (req, res) => {
  const projects = await projectMember.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "projects",
        localField: "project",
        foreignField: "_id",
        as: "projects",
        pipeline: [
          {
            from: "projectMembers",
            localField: "_id",
            foreignField: "project",
            as: "projectMembers",
          },
        ],
      },
    },
    {
      $addFields: {
        member: {
          $size: "projectMembers",
        },
      },
    },
    {
      $unwind: "$project",
    },
    {
      $project: {
        project: {
          id: 1,
          name: 1,
          description: 1,
          members: 1,
          createdAt: 1,
          createdBy: 1,
        },
        role: 1,
        _id: 0,
      },
    },
  ]);

  return res
    .status(200)
    .json(new apiResponse(200, projects, "all projects fetched"));
});

const getProjectId = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await project.findById(projectId);

  if (!project) throw new apiError(404, "project not found");
  return res.status(200).json(new apiResponse(200, project, "got the project"));
});

const createProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const project = await project.create({
    name,
    description,
    createdBy: mongoose.Types.ObjectId(req.user._id),
  });

  await projectMember.create({
    project: mongoose.Types.ObjectId(project._id),
    user: mongoose.Types.ObjectId(req.user._id),
    role: userRolesEnum.ADMIN,
  });

  return res
    .status(201)
    .json(new apiResponse(201, project, "project created successfully"));
});
const updateProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const { projectId } = req.params;

  const updateProject = await project.findByIdAndUpdate(
    projectId,
    {
      name,
      description,
    },
    {
      new: true,
    },
  );

  if (!updateProject) throw new apiError(404, "project not found");

  return res
    .status(200)
    .apiResponse(200, updateProject, "project updated successfully");
});
const deleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const deleteProject = await project.findByIdAndDelete(projectId);

  if (!deleteProject) throw new apiError(404, "project not found");

  return res
    .status(200)
    .apiResponse(200, deleteProject, "project deleted successfully");
});
const addMembersToProject = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  const { projectId } = req.params;

  const user = await User.findOne({ email });

  if (!user) throw new apiError(404, "user not found");

  await projectMember.findByIdAndUpdate(
    {
      user: new mongoose.Types.ObjectId(user._id),
      project: new mongoose.Types.ObjectId(projectId),
    },
    {
      user: new mongoose.Types.ObjectId(user._id),
      project: new mongoose.Types.ObjectId(projectId),
      role,
    },
    {
      new: true,
      upsert: true,
    },
  );

  return res
    .status(201)
    .json(new apiResponse(201, {}, "member added successfully"));
});
const getProjectMembers = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await project.findById(projectId);

  if (!project) throw new apiError(404, "project not found");

  const projectMembers = await projectMember.aggregate([
    {
      $match: {
        project: new mongoose.Types.ObjectId(projectId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
        pipeline: {
          $project: {
            avatar: 1,
            _id: 1,
            fullname: 1,
            email: 1,
            username: 1,
          },
        },
      },
    },

    {
      $addFields: {
        user: {
          $arrayElemAt: ["$user", 0],
        },
      },
    },

    {
      $project: {
        project: 1,
        user: 1,
        createdAt: 1,
        updatedAt: 1,
        _id: 0,
      },
    },
  ]);

  return res
    .status(200)
    .json(new apiResponse(200, projectMembers, "project members fetched"));
});
const updateMemberRole = asyncHandler(async (req, res) => {});
const deleteMember = asyncHandler(async (req, res) => {});

export {
  getProjects,
  getProjectId,
  createProject,
  updateProject,
  deleteProject,
  addMembersToProject,
  getProjectMembers,
  updateMemberRole,
  deleteMember,
};
