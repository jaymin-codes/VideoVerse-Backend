import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteImageFromCloudinary,
  deleteVideoFromCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 2, query, sortBy, sortType, userId } = req.query;

  const videos = await Video.aggregate([
    {
      $match: {
        $or: [
          { title: { $regex: query || "", $options: "i" } },
          { description: { $regex: query || "", $options: "i" } },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              userName: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$owner",
    },
  ])
    .limit(limit)
    .skip(limit * (page - 1))
    .sort({ createdAt: -1 });

  res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

//@desc    publish a new video
//@route   POST video/publish-video
const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    throw new ApiError(400, "All fields are required");
  }

  if (!req.files || !req.files.video || !req.files.thumbnail) {
    throw new ApiError(400, "Video and thumbnail are required");
  }

  const localVideoPath = req.files?.video[0]?.path;
  const video = await uploadOnCloudinary(localVideoPath);
  if (!video) {
    throw new ApiError(400, "Error while uploading video");
  }

  const localThumbnailPath = req.files?.thumbnail[0]?.path;
  const thumbnail = await uploadOnCloudinary(localThumbnailPath);
  if (!thumbnail) {
    throw new ApiError(400, "Error while uploading thumbnail");
  }

  const newVideo = await Video.create({
    videoFile: video.url,
    videoPublicId: video.public_id,
    owner: req.user?._id,
    title: title,
    description: description,
    thumbnail: thumbnail.url,
    thumbnailPublicId: thumbnail.public_id,
    duration: video.duration,
  });
  if (!newVideo) {
    throw new ApiError(500, "Error while saving in db");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, newVideo, "Video created successfully"));
}); //done

//@desc    get a video
//@route   GET video/current-video/:videoId
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID, video not found");
  }

  const video = await Video.findByIdAndUpdate(videoId, {
    $inc: { views: 1 },
  });
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  await video.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video found successfully"));
}); //done

//@desc    update video
//@route   POST video/update-video/:videoId
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID, video not found");
  }

  const { title, description } = req.body;
  if (!title || !description) {
    throw new ApiError(400, "All fields are required");
  }

  const localThumbnailPath = req.file?.path;
  if (!localThumbnailPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  const thumbnail = await uploadOnCloudinary(localThumbnailPath);
  if (!thumbnail) {
    throw new ApiError(400, "Error while uploading thumbnail");
  }

  //delete old thumbnail image
  const { thumbnailPublicId } = await Video.findById(videoId);
  const del = await deleteImageFromCloudinary(thumbnailPublicId);
  if (!del) {
    throw new ApiError(400, "Error while deleting thumbnail");
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title: title,
        description: description,
        thumbnail: thumbnail.url,
        thumbnailPublicId: thumbnail.public_id,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
}); //done

//@desc    delete video
//@route   DELETE video/delete-video/:videoId
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID, video not found");
  }

  const video = await Video.findById(videoId);

  //delete from cloudinary
  const delVideo = await deleteVideoFromCloudinary(video.videoPublicId); //todo: not working
  if (!delVideo) {
    throw new ApiError(400, "Error while deleting video");
  }

  const delThumbnail = await deleteImageFromCloudinary(video.thumbnailPublicId);
  if (!delThumbnail) {
    throw new ApiError(400, "Error while deleting thumbnail");
  }

  //delete from db
  const delVideoFromDb = await Video.findByIdAndDelete(videoId);
  if (!delVideoFromDb) {
    throw new ApiError(400, "Error while deleting video");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Video deleted successfully from db and cloudinary"
      )
    );
}); //done

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID, video not found");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const { isPublished, title, videoFile } = video;
  const newStatus = !isPublished;

  const updatedPublishStatus = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: { isPublished: newStatus },
    },
    {
      new: true,
    }
  );
  if (!updatedPublishStatus) {
    throw new ApiError(400, "Error while updating publish status");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { title, videoFile, isPublished: newStatus },
        "Video publish status updated successfully"
      )
    );
}); //done

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
