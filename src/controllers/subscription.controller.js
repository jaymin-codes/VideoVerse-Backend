import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Channel id is required");
  }

  const userId = req.user?._id;
  if (userId == channelId) {
    throw new ApiError(400, "Cannot subscribe to your own channel");
  }

  const alreadySubscribed = await Subscription.find({
    subscriber: userId,
    channel: channelId,
  });

  if (alreadySubscribed.length === 0) {
    const newSub = await Subscription.create({
      subscriber: userId,
      channel: channelId,
    });
    if (!newSub) {
      throw new ApiError(500, "Error while subscribing");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, newSub, "Subscribed successfully"));
  } else {
    const removeSub = await Subscription.findOneAndDelete({
      subscriber: userId,
      channel: channelId,
    });
    if (!removeSub) {
      throw new ApiError(500, "Error while Un-subscribing");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, removeSub, "Un-Subscribed successfully"));
  }
}); //done

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId, page = 1 } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Channel id is required");
  }

  const subscriberList = await Subscription.aggregate([
    {
      $match: { channel: new mongoose.Types.ObjectId(channelId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
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
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
        pipeline: [
          {
            $project: {
              _id: 1,
              userName: 1,
            },
          },
        ],
      },
    },
  ])
    .limit(20)
    .skip(20 * (page - 1));

  if (!subscriberList) {
    throw new ApiError(500, "Error while fetching subscriber list");
  }

  if (subscriberList.length == 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, subscriberList, "No subscribers yet"));
  } else {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          subscriberList,
          "Subscribers list fetched successfully"
        )
      );
  }
}); //done

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId, page = 1 } = req.params;
  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Subscriber id is required");
  }

  const channelList = await Subscription.aggregate([
    {
      $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
        pipeline: [
          {
            $project: {
              userName: 1,
              fullName: 1,
              _id: 1,
            },
          },
        ],
      },
    },
  ])
    .limit(20)
    .skip(20 * (page - 1));

  if (!channelList) {
    throw new ApiError(500, "Error while fetching channel list");
  }

  if (channelList.length == 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, channelList, "No channel subscribed yet"));
  } else {
    return res
      .status(200)
      .json(
        new ApiResponse(200, channelList, "Channel list fetched successfully")
      );
  }
}); //done

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
