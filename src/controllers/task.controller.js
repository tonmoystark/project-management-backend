import { apiError } from "../utils/api-error";
import { apiResponse } from "../utils/api-response";
import { asyncHandler } from "../utils/async-handler";
import { project } from "../models/project.model.js";
import mongoose from "mongoose";
import { availableUsers, userRolesEnum } from "../utils/constants.js";

const getTasks = asyncHandler(async (res, req) => {});
const getTaskId = asyncHandler(async (res, req) => {});
const createTask = asyncHandler(async (res, req) => {});
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
