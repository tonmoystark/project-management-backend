import { User } from "../models/user.model.js";
import { apiResponse } from "../utils/api-response.js";
import { apiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  sendMail,
} from "../utils/mail.js";
import jwt from "jsonwebtoken";

const generateAccessandRefreshToken = async (userID) => {
  try {
    const user = await User.findById(userID);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(500, "something went wrong while generating tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
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

  const createdUser = await User.findById(user._id).select(
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

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new apiError(400, "email  is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new apiError(404, "User not found, Need registration");
  }

  const isValidPassword = await user.isPasswordValid(password.toString());

  if (!isValidPassword) {
    throw new apiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessandRefreshToken(
    user._id,
  );

  const loggedinUser = await User.findById(user._id).select(
    "-password -emailVerificationToken -emailVerificationExpiry",
  );

  const optionsForCookie = {
    httponly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, optionsForCookie)
    .cookie("accessToken", accessToken, optionsForCookie)
    .json(
      new apiResponse(
        200,
        { user: loggedinUser, accessToken, refreshToken },
        "User logged in successfully",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: "",
      },
    },
    {
      new: true,
    },
  );

  const options = {
    httpsOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new apiResponse(200, {}, "User logged out successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new apiResponse(200, req.user, "got the current user"));
});
const verifyEmail = asyncHandler(async (req, res) => {
  const { verificationToken } = await req.params;

  if (!verificationToken) {
    throw new apiError(400, "email verification token is missing");
  }

  let hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new apiError(404, "Token is invalid or expired");
  }

  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;

  user.isVerified = true;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new apiResponse(200, { isVerified: true }, "Email verified successfully"),
    );
});
const resendEmailVerification = asyncHandler(async (req, res) => {
  const isLoggedinUser = await User.findById(req.user._id);

  if (!isLoggedinUser) {
    throw new apiError(404, "User not found");
  }

  if (isLoggedinUser.isVerified) {
    throw new apiError(400, "User is already verified");
  }

  const { unHashedToken, hashedToken, expiryToken } =
    isLoggedinUser.generateTemporaryToken();

  isLoggedinUser.emailVerificationToken = hashedToken;
  isLoggedinUser.emailVerificationExpiry = expiryToken;

  await isLoggedinUser.save({ validateBeforeSave: false });

  sendMail({
    email: isLoggedinUser?.email,
    subject: "Please verify your email address",
    mailgenContent: emailVerificationMailgenContent(
      isLoggedinUser?.username,
      `${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${unHashedToken}`,
    ),
  });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Verification email sent successfully"));
});
const refreshAccessToken = asyncHandler(async (req, res) => {
  const { incomingRefreshToken } =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new apiError(401, "Access Unauthorized");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new apiError(401, "Token invalid");
    }

    if (user?.refreshToken !== incomingRefreshToken) {
      throw new apiError(401, "Token invalid");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } = await generateAccessandRefreshToken(
      user._id,
    );

    user.refreshToken = refreshToken;
    user.save();

    return res
      .status(200)
      .cookie("refreshToken", refreshToken, options)
      .cookie("accessToken", accessToken, options)
      .json(
        new apiResponse(
          200,
          { accessToken, refreshToken },
          "access Token refreshed",
        ),
      );
  } catch (error) {
    throw new apiError(401, "Invalid access token");
  }
});
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new apiError(404, "User not found");
  }

  const { unHashedToken, hashedToken, expiryToken } =
    user.generateTemporaryToken();

  user.passwordResetToken = hashedToken;
  user.passwordResetExpiry = expiryToken;

  await user.save({ validateBeforeSave: false });

  await sendMail({
    email: user?.email,
    subject: "Please reset your password",
    mailgenContent: forgotPasswordMailgenContent(
      user?.username,
      // `${req.protocol}://${req.get("host")}/api/v1/auth/forgot-password/${unHashedToken}` -> no problem in this,
      `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`,
    ),
  });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Password reset email sent successfully"));
});
const resetForgotPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  let hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    forgotPasswordToken: hashedToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new apiError(489, "Invalid or expired token");
  }

  user.forgotPasswordExpiry = undefined;
  user.forgotPasswordToken = undefined;

  user.password = password;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Password reset successfully"));
});
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);

  const isValidPassword = await user.isPasswordValid(oldPassword);

  if (!isValidPassword) {
    throw new apiError(400, "Password is not correct");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Password changed successfully"));
});

export {
  registerUser,
  login,
  logoutUser,
  getCurrentUser,
  verifyEmail,
  resendEmailVerification,
  refreshAccessToken,
  forgotPassword,
  resetForgotPassword,
  changeCurrentPassword,
};
