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
