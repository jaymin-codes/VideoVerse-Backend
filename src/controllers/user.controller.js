import { asyncHandler } from "../utils/asyncHandler.js";

//@desc    Register a new user
//@route   POST /api/users/register
const registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: "ok",
  });
});

export { registerUser };
