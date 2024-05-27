import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name || !description) {
    throw new ApiError(400, "name and description are required");
  }

  const alreadyExists = await Playlist.find({
    name: name,
    owner: req.user?._id,
  });

  if (alreadyExists.length === 0) {
    const newPlaylist = await Playlist.create({
      name: name,
      description: description,
      owner: req.user?._id,
    });
    if (!newPlaylist) {
      throw new ApiError(500, "Error while creating playlist");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, newPlaylist, "playlist created successfully"));
  } else {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "playlist already exists"));
  }
}); //done

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const playlists = await Playlist.find({ owner: userId });

  if (playlists.length === 0) {
    return res.status(404).json(new ApiResponse(404, {}, "no playlist found"));
  } else {
    return res
      .status(200)
      .json(new ApiResponse(200, playlists, "playlists fetched successfully"));
  }
}); //done

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid Playlist Id");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist fetched successfully"));
}); //done

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId || !videoId) {
    throw new ApiError(400, "playlisdId and videoId are required");
  }
   if (!isValidObjectId(videoId) || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid video or playlist id");
  }

  const addVideo = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: { videos: videoId },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, addVideo, "video added to playlist"));
}); //done

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId || !videoId) {
    throw new ApiError(400, "playlisdId and videoId are required");
  }
  if (!isValidObjectId(videoId) || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid video or playlist id");
  }

  const removeVideo = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { videos: videoId },
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, removeVideo, "video removed to playlist"));
}); //done

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id")
  }

  const playlist = await Playlist.findByIdAndDelete(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
}); //done

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  if (!name || !description) {
    throw new ApiError(400, "name and description are required")
  }
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
        $set: {name: name, description: description}
    },
    {
        new: true
    }
  )
  if(!updatePlaylist){
    throw new ApiError(500, "Error while updating playlist")
  }

  return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Playlist updated successfully"))

}); //done

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
