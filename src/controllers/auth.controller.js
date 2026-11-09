import { User } from "../models/user.model.js";
import { apiResponse } from "../utils/api-response.js";
import { apiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { emailVerificationMailgenContent, sendMail } from "../utils/mail.js";

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

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Email verified successfully"));
});
// const getCurrentUser = asyncHandler(async (req, res) => {});

export { registerUser, login, logoutUser, getCurrentUser, verifyEmail };
