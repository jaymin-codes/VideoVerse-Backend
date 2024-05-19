import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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
  const userExists = User.findOne({
    $or: [{ email }, { userName }],
  });
  if (userExists) {
    throw new ApiError(409, "Username or email already registered");
  }

  console.log(req.body); //remove, just for knowledge
  console.log(req.files);

  //upload middleware(multer)
  // check for images, avatar image compulsory
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
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
    .json(new ApiResponse(200, createdUser, "User reggistered successfully"));
});

export { registerUser };
