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
    console.log("File is uploaded on cloudinary ", res.url);
    return res;
    
  } catch (error) {
    fs.unlinkSync(localFilePath); //remove the temp file from server ass upload operation failed
    return null;

  }
};

export { uploadOnCloudinary };
