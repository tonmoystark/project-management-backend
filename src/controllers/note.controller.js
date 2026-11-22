import mongoose from "mongoose";
import { apiError } from "../utils/api-error";
import { apiResponse } from "../utils/api-response";
import { asyncHandler } from "../utils/async-handler";
import { project } from "../models/project.model.js";
import { note } from "../models/note.model.js";

const createNote = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { title } = req.body;

  if (!isValidMongoId(projectId)) {
    throw new apiError(400, "Invalid project id");
  }

  const projectExists = await project.findById(projectId);
  if (!projectExists) {
    throw new apiError(400, "Invalid project id");
  }

  const noteExists = await note.create({
    title,
    project: projectId,
    createdBy: req.user._id,
  });

  if (!noteExists) {
    throw new apiError(400, "Failed to create note");
  }

  const creatednote = await note
    .findById(noteExists._id)
    .select("-project -createdBy");

  return apiResponse(200, creatednote, "Note created successfully");
});

const getAllNotes = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const matchStage = {
    createdBy: new mongoose.Types.ObjectId(req.user._id),
  };

  if (projectId) {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new apiError(400, "Invalid project ID");
    }
    matchStage.project = new mongoose.Types.ObjectId(projectId);
  }

  const notes = await note.aggregate([
    {
      $match: matchStage,
    },
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
              email: 1,
              avatar: 1,
            },
          },
        ],
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
      $addFields: {
        createdBy: {
          $arrayElemAt: ["$createdBy", 0],
        },
        project: {
          $arrayElemAt: ["$project", 0],
        },
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
        title: 1,
        createdAt: 1,
        updatedAt: 1,
        project: {
          _id: "$project._id",
          name: "$project.name",
          description: "$project.description",
        },
        createdBy: {
          _id: "$createdBy._id",
          username: "$createdBy.username",
          fullName: "$createdBy.fullName",
          email: "$createdBy.email",
          avatar: "$createdBy.avatar",
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(new apiResponse(200, notes, "Notes fetched successfully"));
});

export { createNote, getAllNotes };
