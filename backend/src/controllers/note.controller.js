import mongoose from "mongoose";
import { apiError } from "../utils/api-error.js";
import { apiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { project } from "../models/project.model.js";
import { note } from "../models/note.model.js";

const createNote = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { title } = req.body;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
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

  const createdNote = await note
    .findById(noteExists._id)
    .select("-project -createdBy");

  return res
    .status(201)
    .json(new apiResponse(201, createdNote, "Note created successfully"));
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

const updateNote = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;
  const { title } = req.body;

  if (!mongoose.Types.ObjectId.isValid(noteId)) {
    throw new apiError(400, "Invalid note ID");
  }

  if (projectId && !mongoose.Types.ObjectId.isValid(projectId)) {
    throw new apiError(400, "Invalid project ID");
  }

  const filter = {
    _id: new mongoose.Types.ObjectId(noteId),
  };

  if (projectId) {
    filter.project = new mongoose.Types.ObjectId(projectId);
  }

  if (!req.note) {
    filter.createdBy = new mongoose.Types.ObjectId(req.user._id);
  }

  const updatedNote = await note
    .findOneAndUpdate(
      filter,
      { $set: { title } },
      { new: true, runValidators: true },
    )
    .populate("createdBy", "username fullName avatar")
    .populate("project", "name");

  if (!updatedNote) {
    throw new apiError(404, "Note not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, updatedNote, "Note updated successfully"));
});

const deleteNote = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(noteId)) {
    throw new apiError(400, "Invalid note ID");
  }

  if (projectId && !mongoose.Types.ObjectId.isValid(projectId)) {
    throw new apiError(400, "Invalid project ID");
  }

  const filter = {
    _id: new mongoose.Types.ObjectId(noteId),
  };

  if (projectId) {
    filter.project = new mongoose.Types.ObjectId(projectId);
  }

  if (!req.note) {
    filter.createdBy = new mongoose.Types.ObjectId(req.user._id);
  }

  const deletedNote = await note.findOneAndDelete(filter);

  if (!deletedNote) {
    throw new apiError(404, "Note not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Note deleted successfully"));
});

export { createNote, getAllNotes, updateNote, deleteNote };

