import { apiError } from "../utils/api-error.js";
import { apiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { project } from "../models/project.model.js";
import { User } from "../models/user.model.js";
import { projectMember } from "../models/projectMember.model.js";
import mongoose from "mongoose";
import {
  availableUsers,
  memberStatusEnum,
  userRolesEnum,
} from "../utils/constants.js";

const getProjects = asyncHandler(async (req, res) => {
  const projects = await projectMember.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(req.user._id),
        status: { $ne: memberStatusEnum.PENDING },
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
            $lookup: {
              from: "projectmembers",
              localField: "_id",
              foreignField: "project",
              as: "projectMembers",
              pipeline: [
                {
                  $match: {
                    status: { $ne: memberStatusEnum.PENDING },
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              members: {
                $size: "$projectMembers",
              },
            },
          },
        ],
      },
    },
    {
      $unwind: "$projects",
    },
    {
      $project: {
        project: {
          _id: "$projects._id",
          name: "$projects.name",
          description: "$projects.description",
          members: "$projects.members",
          createdAt: "$projects.createdAt",
          createdBy: "$projects.createdBy",
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

  const fetchProject = await project.findById(projectId);

  if (!fetchProject) throw new apiError(404, "project not found");
  return res
    .status(200)
    .json(new apiResponse(200, fetchProject, "got the project"));
});

const createProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const createdProject = await project.create({
    name,
    description,
    createdBy: new mongoose.Types.ObjectId(req.user._id),
  });

  await projectMember.create({
    project: new mongoose.Types.ObjectId(createdProject._id),
    user: new mongoose.Types.ObjectId(req.user._id),
    role: userRolesEnum.ADMIN,
    status: memberStatusEnum.ACCEPTED,
  });

  return res
    .status(201)
    .json(new apiResponse(201, createdProject, "project created successfully"));
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
    .json(new apiResponse(200, updateProject, "project updated successfully"));
});
const deleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const deleteProject = await project.findByIdAndDelete(projectId);

  if (!deleteProject) throw new apiError(404, "project not found");

  return res
    .status(200)
    .json(new apiResponse(200, {}, "project deleted successfully"));
});
const addMembersToProject = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  const { projectId } = req.params;

  const user = await User.findOne({ email });

  if (!user) throw new apiError(404, "user not found");

  const existingMember = await projectMember.findOne({
    user: new mongoose.Types.ObjectId(user._id),
    project: new mongoose.Types.ObjectId(projectId),
  });

  if (existingMember && existingMember.status !== memberStatusEnum.PENDING) {
    throw new apiError(409, "User is already a member of this project");
  }

  const invitation = await projectMember.findOneAndUpdate(
    {
      user: new mongoose.Types.ObjectId(user._id),
      project: new mongoose.Types.ObjectId(projectId),
    },
    {
      user: new mongoose.Types.ObjectId(user._id),
      project: new mongoose.Types.ObjectId(projectId),
      role,
      status: memberStatusEnum.PENDING,
      invitedBy: new mongoose.Types.ObjectId(req.user._id),
    },
    {
      new: true,
      upsert: true,
    },
  );

  return res
    .status(201)
    .json(
      new apiResponse(
        201,
        invitation,
        "Invitation sent. The user will gain access once they accept.",
      ),
    );
});
const getProjectMembers = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const foundProject = await project.findById(projectId);

  if (!foundProject) throw new apiError(404, "project not found");

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
        pipeline: [
          {
            $project: {
              avatar: 1,
              _id: 1,
              fullName: 1,
              email: 1,
              username: 1,
            },
          },
        ],
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
        role: 1,
        status: { $ifNull: ["$status", memberStatusEnum.ACCEPTED] },
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
const updateMemberRole = asyncHandler(async (req, res) => {
  const { projectId, userId } = req.params;
  const { newRole } = req.body;

  if (!availableUsers.includes(newRole))
    throw new apiError(400, "invalid role");

  const foundProjectMember = await projectMember.findOne({
    project: new mongoose.Types.ObjectId(projectId),
    user: new mongoose.Types.ObjectId(userId),
  });

  if (!foundProjectMember) throw new apiError(400, "project member not found");

  const updatedRole = await projectMember.findByIdAndUpdate(
    foundProjectMember._id,
    {
      role: newRole,
    },
    {
      new: true,
    },
  );

  if (!updatedRole) throw new apiError(400, "member not found");

  return res
    .status(200)
    .json(new apiResponse(200, updatedRole, "memeber role updated"));
});
const deleteMember = asyncHandler(async (req, res) => {
  const { projectId, userId } = req.params;

  const foundProjectMember = await projectMember.findOne({
    user: new mongoose.Types.ObjectId(userId),
    project: new mongoose.Types.ObjectId(projectId),
  });

  if (!foundProjectMember) throw new apiError(400, "member not found");

  const deletedMember = await projectMember.findByIdAndDelete(
    foundProjectMember._id,
  );

  if (!deletedMember) throw new apiError(400, "member not found");

  return res
    .status(200)
    .json(new apiResponse(200, {}, "member deleted successfully"));
});

const getMyInvitations = asyncHandler(async (req, res) => {
  const invitations = await projectMember.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(req.user._id),
        status: memberStatusEnum.PENDING,
      },
    },
    {
      $lookup: {
        from: "projects",
        localField: "project",
        foreignField: "_id",
        as: "project",
        pipeline: [
          {
            $project: {
              _id: 1,
              name: 1,
              description: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "invitedBy",
        foreignField: "_id",
        as: "invitedBy",
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
        project: { $arrayElemAt: ["$project", 0] },
        invitedBy: { $arrayElemAt: ["$invitedBy", 0] },
      },
    },
    {
      $match: {
        project: { $ne: null },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        _id: 1,
        role: 1,
        status: 1,
        project: 1,
        invitedBy: 1,
        createdAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new apiResponse(200, invitations, "Invitations fetched successfully"),
    );
});

const acceptInvitation = asyncHandler(async (req, res) => {
  const { invitationId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(invitationId)) {
    throw new apiError(400, "Invalid invitation ID");
  }

  const accepted = await projectMember.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(invitationId),
      user: new mongoose.Types.ObjectId(req.user._id),
      status: memberStatusEnum.PENDING,
    },
    {
      $set: { status: memberStatusEnum.ACCEPTED },
    },
    { new: true },
  );

  if (!accepted) {
    throw new apiError(404, "Pending invitation not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, accepted, "Invitation accepted"));
});

const rejectInvitation = asyncHandler(async (req, res) => {
  const { invitationId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(invitationId)) {
    throw new apiError(400, "Invalid invitation ID");
  }

  const rejected = await projectMember.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(invitationId),
    user: new mongoose.Types.ObjectId(req.user._id),
    status: memberStatusEnum.PENDING,
  });

  if (!rejected) {
    throw new apiError(404, "Pending invitation not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Invitation declined"));
});

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
  getMyInvitations,
  acceptInvitation,
  rejectInvitation,
};
