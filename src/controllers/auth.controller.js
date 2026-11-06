import User from "../models/user.model.js";
import { apiResponse } from "../utils/api-response.js";
import { apiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { emailVerificationMailgenContent, sendMail } from "../utils/mail.js";

const generateAccessandRefreshToken = async (userID) => {
  try {
    const user = await User.findbyId(userID);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(500, "something went wrong while generating tokens");
  }
};

const registerUser = asyncHandler(async (req, res, next) => {
  const { username, email, password, role } = req.body;

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new apiError(409, "User with email or username already exists");
  }

  const user = await User.create({
    username,
    email,
    password,
    isVerified: false,
    role,
  });

  const { unHashedToken, hashedToken, expiryToken } =
    user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = expiryToken;

  await user.save({ validateBeforeSave: false });

  sendMail({
    email: user?.email,
    subject: "Please verify your email address",
    mailgenContent: emailVerificationMailgenContent(
      user?.username,
      `${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${unHashedToken}`,
    ),
  });

  const createdUser = await User.findbyId(user._id).select(
    "-password -emailVerificationToken -emailVerificationExpiry",
  );

  if (!createdUser) {
    throw new apiError(500, "something went wrong while creating user");
  }

  return res
    .status(201)
    .json(
      new apiResponse(
        201,
        { user: createdUser },
        "User created successfully and verification email sent",
      ),
    );
});

export { registerUser };
