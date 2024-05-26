import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;
  if (!isValidObjectId(videoId) || !isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid video or user id");
  }

  const like = await Like.find({ video: videoId, likedBy: userId });

  if (like.length === 0) {
    await Like.create({
      video: videoId,
      likedBy: userId,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Video liked successfully"));
  } else {
    await Like.findOneAndDelete({ video: videoId, likedBy: userId });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Video disliked successfully"));
  }
}); //done

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user?._id;
  if (!isValidObjectId(commentId) || !isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid comment or user id");
  }

  const like = await Like.find({ comment: commentId, likedBy: userId });

  if (like.length === 0) {
    await Like.create({
      comment: commentId,
      likedBy: userId,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment liked successfully"));
  } else {
    await Like.findOneAndDelete({ comment: commentId, likedBy: userId });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment disliked successfully"));
  }
}); //done

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user?._id;
  if (!isValidObjectId(tweetId) || !isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid tweet or user id");
  }

  const like = await Like.find({ tweet: tweetId, likedBy: userId });

  if (like.length === 0) {
    await Like.create({
      tweet: tweetId,
      likedBy: userId,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Tweet liked successfully"));
  } else {
    await Like.findOneAndDelete({ tweet: tweetId, likedBy: userId });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Tweet disliked successfully"));
  }
}); //done

const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const likedVideos = await Like.aggregate([
    {
      $match: { likedBy: userId, video: { $ne: null } },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
          {
            $project: {
              title: 1,
              videoFile: 1,
              thumbnail: 1, //add owner deatls
            },
          },
        ],
      },
    },
  ]);
  if (!likedVideos) {
    throw new ApiError(400, "Error while fetching liked videos");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    );
}); //done

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
