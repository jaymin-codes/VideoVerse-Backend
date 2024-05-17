import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));//setting limit to json size
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));//this for temp files which users uploads
app.use(cookieParser());//access cookies in user browser from server

export { app };
