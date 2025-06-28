const express = require("express");

const bodyParser = require("body-parser");

const mongoose = require("mongoose");

const path = require("path");

const multer = require("multer");

const { v4: uuidv4 } = require("uuid");

const { createHandler } = require("graphql-http/lib/use/express");

const graphqlSchema = require("./graphql/schema");
const graphqlResolvers = require("./graphql/resolvers");

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
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(
  "/graphql",
  createHandler({
    schema: graphqlSchema,
    rootValue: graphqlResolvers,
    formatError(err) {
      if (!err.originalError) {
        return err;
      }
      const code = err.originalError.code || 500;
      const data = err.originalError.data;
      const message = err.message || "An error occured";
      return { message: message, code: code, data: data };
    },
  })
);

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
    app.listen(process.env.PORT);
  })
  .catch((err) => {
    console.log(err);
  });
