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

const getNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  if (!isValidMongoId(noteId)) {
    throw new apiError(400, "Invalid note id");
  }

  const noteExists = await note.findById(noteId);
  if (!noteExists) {
    throw new apiError(400, "Invalid note id");
  }
  
  const fetchedNote = await note.findById(noteId).select("-project -createdBy");
  if (!fetchedNote) {
    throw new apiError(400, "Failed to fetch note");
  }

  return apiResponse(200, fetchedNote, "Note fetched successfully");
});
