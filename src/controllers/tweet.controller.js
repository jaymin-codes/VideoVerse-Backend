import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const { tweet } = req.body;
  if (!tweet) {
    throw new ApiError(400, "Tweet is required");
  }

  const addTweet = await Tweet.create({
    owner: userId,
    content: tweet,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, addTweet, "Tweet created successfully"));
}); //done

const getUserTweets = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const tweets = await Tweet.find({ owner: userId });
  if (!tweets) {
    throw new ApiError(400, "Error while fetching tweets");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
}); //done

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId, tweet } = req.body;
  if (!tweetId || !tweet) {
    throw new ApiError(400, "tweetId and tweet are required");
  }
  if (!mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Comment Id");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: { content: tweet },
    },
    {
      new: true,
    }
  );
  if (!updatedTweet) {
    throw new ApiError(400, "Error while updating comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
}); //done

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.body;
  if (!tweetId) {
    throw new ApiError(400, "Tweet Id is required");
  }
  if (!mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Comment Id");
  }

  const del = await Tweet.findByIdAndDelete(tweetId);
  if (!del) {
    throw new ApiError(400, "Error while deleting tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, del, "Tweet deleted successfully"));
}); //done

export { createTweet, getUserTweets, updateTweet, deleteTweet };
