// require('dotenv').config({path: './env'})
import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/db.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      try {
        app.on("error", (error) => {
          console.log("ERR: ", error);
          throw error;
        });
        console.log(`Server is running at port ${process.env.PORT}`);
      } catch (error) {
        console.log("MongoDB connection FAILED !!: ", error);
      }
    });
  })
  .catch((err) => {
    console.log("MongoDB connection FAILED !!", err);
  });








  
/*
here all code is in one file, it works same but its better to make a db.js
import express from "express";
const app = express()(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", (error) => {
      console.log("ERRR: ", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`App is listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.log("Error: ", error);
    throw err;
  }
})();
*/
