import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import {
  uploadOnCloudinary,
  deleteImageFromCloudinary
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    // console.log("1",user);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });
    // console.log("2",user.refreshToken);
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

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
    throw new ApiError(400, "Error while uploading avatar image.");
  }

  // create user object - create entry in db
  const newUser = await User.create({
    fullName,
    avatar: avatar.url,
    avatarPublicId: avatar.public_id,
    coverImage: coverImage?.url || "",
    coverImagePublicId: coverImage?.public_id || "",
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

//@desc    Logout User
//@route   POST /api/users/logout
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, //this removes the token string
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

//@desc    New access token from refresh token
//@route   POST /api/users/refresh-token
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

//@desc    Change current user password
//@route   PATCH /api/users/change-password
const changeCurrentUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isOldPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

//@desc    Get current user
//@route   GET /api/users/current-user
const getCurrentUser = asyncHandler(async (req, res) => {
  //  console.log(req.user);
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

//@desc   Update account details
//@route  PATCH /api/users/update-user
const updateAccountdetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body; //comes from frontend

  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    { new: true }
    //res has the new updated info, if false than non-updated data is returned
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account updated successfully"));
});

//@desc   Update avatar image
//@route  PATCH /api/users/update-avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
  //upload new avatar image
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar?.url) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  //delete old avatar image
  const { avatarPublicId } = await User.findById(req.user?._id);
  const del = await deleteImageFromCloudinary(avatarPublicId);
  if (!del) {
    throw new ApiError(400, "Error while deleting avatar image");
  }

  //updating user object
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { avatar: avatar.url, avatarPublicId: avatar.public_id },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

//@desc   Update cover image
//@route  PATCH /api/users/update-coverImg
const updateUserCoverImage = asyncHandler(async (req, res) => {
  // upload new cover image
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image is missing");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage?.url) {
    throw new ApiError(400, "Error while uploading cover image");
  }

  //delete old cover image
  const { coverImagePublicId } = await User.findById(req.user?._id);
  if (coverImagePublicId) {
    console.log(coverImagePublicId);
    const del = await deleteImageFromCloudinary(coverImagePublicId);
    console.log(del);
    if (!del) {
      throw new ApiError(400, "Error deleting cover image");
    }
  }

  // updating user object
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage.url,
        coverImagePublicId: coverImage.public_id,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

//@desc   User's profile page or channel page
//@route
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;

  if (!userName?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        userName: userName,
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $in: [req.user?._id, "$subscribedTo.channel"], //important doubt here
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
        isSubscribed: 1,
      },
    },
  ]); //remember: channel and subscriber are both user. just playing diffrent role
  console.log(channel);

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    );
});

//@desc   get user watch history
//@route
const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(req.user?._id) },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            //get owner details from user collection
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  //taking only these fields of owner(user)
                  $project: {
                    fullName: 1,
                    userName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              //adding the owner field in each video obj in watchHistroy
              owner: {
                $first: "$owner", //taking the first element of owner field which has fullname, username, avatar
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch History fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  newAccessToken,
  changeCurrentUserPassword,
  getCurrentUser,
  updateAccountdetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
