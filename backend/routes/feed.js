const express = require("express");

const { body } = require("express-validator");

const router = express.Router();

const isAuth = require("../middleware/is-auth");

const feedController = require("../controller/feed");

//GET /feed/posts
router.get("/posts", isAuth, feedController.getPosts);

//POST /feed/post --> to create a new post
router.post(
  "/post",
  isAuth,
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  feedController.createPost
);

//GET /feed/post/:postId --> to view a single post
router.get("/post/:postId", isAuth, feedController.getPost);

//PUT /feed/post/:postId --> for updating post
router.put(
  "/post/:postId",
  isAuth,
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  feedController.updatePost
);

//DELETE feed/post/:postId
router.delete("/post/:postId", isAuth, feedController.deletePost);

//GET feed/status
router.get("/status", isAuth, feedController.getStatus);

//PATCH feed/status
router.patch(
  "/status",
  isAuth,
  [body("status").trim().not().isEmpty()],
  feedController.updateStatus
);

module.exports = router;
