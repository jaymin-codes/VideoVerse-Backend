import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid VideoId");
  }

  const { page = 1, limit = 2 } = req.query;

  const comments = await Comment.find({ video: videoId })
    .limit(limit)
    .skip(limit * (page - 1));
  if (!comments.length === 0) {
    throw new ApiError(400, "No comments yet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { comments }, "Comments fetched successfully"));
}); //done

const addComment = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId) || !mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid Video or user Id");
  }

  const { comment } = req.body;
  if (!comment) {
    throw new ApiError(400, "Comment is required");
  }

  const newComment = await Comment.create({
    content: comment,
    video: videoId,
    owner: userId,
  });
  if (!newComment) {
    throw new ApiError(400, "Error while submitting comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, newComment, "Comment saved successfully"));
}); //done

const updateComment = asyncHandler(async (req, res) => {
  const { commentId, comment } = req.body;
  if (!commentId || !comment) {
    throw new ApiError(400, "CommentId and comment are required");
  }
  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment Id");
  }

  const newComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: { content: comment },
    },
    {
      new: true,
    }
  );
  if (!newComment) {
    throw new ApiError(404, "Comment not found")
  }

  return res
    .status(200)
    .json(new ApiResponse(200, newComment, "Comment updated successfully"));
}); //done

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.body;
  if (!commentId) {
    throw new ApiError(400, "Comment Id is required");
  }
  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment Id");
  }

  const del = await Comment.findByIdAndDelete(commentId);
  if (!del) {
    throw new ApiError(400, "Error while deleting comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, del, "Comment deleted successfully"));
}); //done

export { getVideoComments, addComment, updateComment, deleteComment };
