const express = require("express");

const bodyParser = require("body-parser");

const feedRoutes = require("./routes/feed");

const authRoutes = require("./routes/auth");

const mongoose = require("mongoose");

const path = require("path");

const multer = require("multer");

const { v4: uuidv4 } = require("uuid");

require("dotenv").config();

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4());
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpeg"
  )
    cb(null, true);
  else cb(null, false);
};

const MONGODB_URI = process.env.MONGODB_URI;

app.use(bodyParser.json());

app.use(
  multer({ fileFilter: fileFilter, storage: fileStorage }).single("image")
);

app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/feed", feedRoutes);

app.use("/auth", authRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const statusCode = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(statusCode).json({ message: message, data: data });
});

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    console.log("DB Connected");
    const server = app.listen(process.env.PORT);
    const io = require("./socket").init(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
    io.on("connection", (socket) => {
      console.log("Client connected");
    });
  })
  .catch((err) => {
    console.log(err);
  });
