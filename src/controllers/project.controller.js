import { apiError } from "../utils/api-error";
import { apiResponse } from "../utils/api-response";
import { asyncHandler } from "../utils/async-handler";
import { project } from "../models/project.model.js";
import { user } from "../models/user.model.js";
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

const getProjectId = asyncHandler(async (req, res) => {});

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
const addMembersToProject = asyncHandler(async (req, res) => {});
const getProjectMembers = asyncHandler(async (req, res) => {});
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
