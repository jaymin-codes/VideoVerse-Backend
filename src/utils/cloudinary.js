import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; //file system in node

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      return null;
    }
    //upload the file on cloudinary
    const res = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //file uploaded successfully than
    // console.log("File is uploaded on cloudinary ", res.url);
    fs.unlinkSync(localFilePath);

    return res;
  } catch (error) {
    fs.unlinkSync(localFilePath); //remove the temp file from server ass upload operation failed
    return null;
  }
};

const deleteImageFromCloudinary = async (imagePublicId) => {
  try {
    if (!imagePublicId) {
      return null;
    }
    const res = await cloudinary.uploader.destroy(imagePublicId, {
      resource_type: "image",
    });
    return res;
  } catch (error) {
    return null;
  }
};

const deleteVideoFromCloudinary = async (videoPublicId) => {
  try {
    if (!videoPublicId) {
      return null;
    }
    const res = await cloudinary.uploader.destroy(videoPublicId, {
      resource_type: "video",
    });
    return res;
  } catch (error) {
    return null;
  }
};

export {
  uploadOnCloudinary,
  deleteImageFromCloudinary,
  deleteVideoFromCloudinary,
};
