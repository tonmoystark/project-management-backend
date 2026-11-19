import mongoose from "mongoose";
import { projectMember } from "../models/projectMember.model.js";
import { User } from "../models/user.model.js";
import { apiError } from "../utils/api-error.js";
import jwt from "jsonwebtoken";

export const verifyJWT = async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization").replace("Bearer ", "");

  if (!token) {
    throw new apiError(401, "Unauthorized");
  }
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded?._id).select(
      "-password -emailVerificationToken -emailVerificationExpiry",
    );

    if (!user) {
      throw new apiError(401, "Token invalid");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new apiError(401, "Token invalid");
  }
};

export const validateProjectPermission = (role = []) => {
  async (req, res, next) => {
    const { projectId } = req.params;

    if (!projectId) throw new apiError(400, "project not found");

    const projectDoc = await projectMember.findOne({
      project: new mongoose.Types.ObjectId(projectId),
      user: new mongoose.Types.ObjectId(req.user._id),
    });

    if (!projectDoc) throw new apiError(400, "project not found");

    const givenRole = projectDoc?.role;

    req.user.role = givenRole;

    if (!role.includes(givenRole))
      throw new apiError(
        403,
        "You do not have the authority to perform this action",
      );

    next();
  };
  return;
};
