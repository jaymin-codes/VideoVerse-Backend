import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    //this is to give a unique name to a file, we are not doing that here
    // const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // cb(null, file.fieldname + "-" + uniqueSuffix);

    cb(null, file.originalname); //we are keeping the original name of the file given by user
    //this may give problem when user upload multipe files with same name
  },
});

export const upload = multer({
  storage,
});
