import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js";

const router = Router();

router.route("/publish-video").post(
  verifyJWT,
  upload.fields([
    {
      name: "video", //refers to the input field name
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishAVideo
);
router.route("/current-video/:videoId").get(getVideoById); //anyone can see a video rn

router
  .route("/update-video/:videoId")
  .patch(verifyJWT, upload.single("thumbnail"), updateVideo);

router.route("/delete-video/:videoId").delete(verifyJWT, deleteVideo);
router.route("/publish-status/:videoId").patch(verifyJWT, togglePublishStatus)

router.route("/all-videos").get(getAllVideos) //todo: PENDING

export default router;
