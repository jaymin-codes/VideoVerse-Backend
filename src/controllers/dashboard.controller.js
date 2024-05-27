import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {

  const totalViews = await Video.aggregate([
    {
      $match: { owner: new mongoose.Types.ObjectId(req.user?._id) },
    },
    {
      $group: {
        _id: null, //ensure that there is only one group for all documents
        totalViews: { $sum: "$views" },
      },
    },
    {
      $project: {
        _id: 0, 
        totalViews: 1, 
      },
    },
  ]);
  if (!totalViews) {
    throw new ApiError(500, "error while getting subscriber count");
  }



  const totalSubscribers = await Subscription.where({
    channel: req.user?._id,
  }).countDocuments();
  if (!totalSubscribers && totalSubscribers!=0) {
    throw new ApiError(500, "error while getting subscriber count");
  }


  
  const totalVideos = await Video.where({
    owner: req.user?._id,
  }).countDocuments();
  if (!totalVideos && totalVideos!=0) {
    throw new ApiError(500, "error while getting video count");
  }

  const totalVideoLikes = await Video.aggregate([
    {
      $match: { owner: new mongoose.Types.ObjectId(req.user?._id) },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "videoLikes",
      },
    },
    {
      $unwind: "$videoLikes",
    },
    {
      $group: {
        _id: null, //ensure that there is only one group for all documents
        videoLikes: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        videoLikes: 1,
      },
    },
  ]);

  const stats = {
    total_subscribers: totalSubscribers,
    total_videos: totalVideos,
    total_views: totalViews[0]?.totalViews || 0,
    total_likes_video: totalVideoLikes[0]?.videoLikes || 0,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const videos = await Video.find({ owner: req.user?._id });

  if (!videos) {
    throw new ApiError(500, "error while fetching videos");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "videos fetched successfully"));
}); //done

export { getChannelStats, getChannelVideos };
