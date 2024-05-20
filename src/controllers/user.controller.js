import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    // console.log("1",user);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    const x = await user.save({ validateBeforeSave: false });
    // console.log("2",user.refreshToken);
    console.log(x, "here");
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

//
//
//@desc    Register a new user
//@route   POST /api/users/register
const registerUser = asyncHandler(async (req, res) => {
  // get details of user from frontend
  const { fullName, userName, email, password } = req.body;

  // validation - empty fields
  if (
    [fullName, userName, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required!!");
  }

  // check user already exists with username or email
  const userExists = await User.findOne({
    $or: [{ email }, { userName }],
  });
  if (userExists) {
    throw new ApiError(409, "Username or email already registered");
  }

  // upload middleware, req.files(multer)
  // check for images, avatar image compulsory
  const avatarLocalPath = req.files?.avatar[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  // upload images to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar image is required");
  }

  // create user object - create entry in db
  const newUser = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    userName: userName.toLowerCase(),
    email,
    password,
  });

  // remove password and refresh token field from response
  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );

  // check for user creation
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // response return
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

//
//
//@desc    Login User
//@route   POST /api/users/login
const loginUser = asyncHandler(async (req, res) => {
  // input from req.body
  const { email, userName, password } = req.body;
  // console.log(email);

  // check for fields empty or not
  if (!userName && !email) {
    throw new ApiError(400, "Email or Username required");
  }

  // check if user exists or not
  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // password check
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  // access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select("-password ");

  // send cookies
  const options = {
    httpOnly: true,
    secure: true, //only modifiable by server
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

//
//
//@desc    Logout User
//@route   POST /api/users/logout
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true, //gives the new updated object
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logout successfull"));
});

//
//
//@desc    New access token from refresh token
//@route   POST /api/users/logout
const newAccessToken = asyncHandler(async (req, res) => {
  // get refresh token from cookies in frontend
  // get refresh token from db

  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw ApiError(401, error?.message || "invalid refresh token");
  }
});

export { registerUser, loginUser, logoutUser, newAccessToken };
