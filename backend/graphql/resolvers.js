const User = require("../models/user");
const Post = require("../models/post");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
let createError = (message, code) => {
  const error = new Error(message);
  error.code = code;
  throw error;
};
let createErrorWithData = (message, code, arrOfErrors) => {
  const error = new Error(message);
  error.code = code;
  error.data = arrOfErrors;
  throw error;
};
module.exports = {
  createUser: async function ({ userInput }, req) {
    let errors = [];
    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: "Email is invalid" });
    }
    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    ) {
      errors.push({ message: "Password is too short" });
    }
    if (errors.length > 0) {
      createErrorWithData("Invalid Input from the resolver", 422, errors);
    }
    const existingUser = await User.findOne({ email: userInput.email });
    if (existingUser) {
      const error = new Error("That user already existing");
      throw error;
    }
    const hashedPass = await bcrypt.hash(userInput.password, 12);
    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPass,
    });
    const createdUser = await user.save();
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },
  login: async function ({ email, password }, req) {
    let errors = [];
    if (!validator.isEmail(email)) {
      errors.push({ message: "Email is invalid" });
    }
    if (
      validator.isEmpty(password) ||
      !validator.isLength(password, { min: 5 })
    ) {
      errors.push({ message: "Password is too short" });
    }
    if (errors.length > 0) {
      createErrorWithData("Invalid Input", 422, errors);
    }
    const user = await User.findOne({ email: email });
    if (!user) {
      createError("User is not found", 401);
    }
    const checkPassword = bcrypt.compare(password, user.password);
    if (!checkPassword) {
      createError("Password is invalid", 422);
    }
    const token = jwt.sign(
      { email: email, userId: user._id },
      process.env.API_SECRET,
      { expiresIn: "1h" }
    );
    console.log(user, token);
    return { userId: user._id.toString(), token: token };
  },
  createPost: async function ({ postData }, req) {
    if (!req.isAuth) {
      createError("Not Authenticated", 401);
    }
    let errors = [];
    if (!validator.isLength(postData.title, { min: 5 })) {
      errors.push({ message: "Title is too short" });
    }
    if (!validator.isLength(postData.content, { min: 5 })) {
      errors.push({ message: "Content is too short" });
    }
    if (validator.isEmpty(postData.imageUrl)) {
      errors.push({ message: "Image url is empty" });
    }
    if (errors.length > 0) {
      createErrorWithData("Invalid input data", 422, errors);
    }
    const user = await User.findById(req.userId);
    if (!user) {
      createError("User not found", 404);
    }
    const post = new Post({
      title: postData.title,
      content: postData.content,
      imageUrl: postData.imageUrl,
      creator: user,
    });
    user.posts.push(post);
    const savedPost = await post.save();
    await user.save();
    return {
      ...savedPost._doc,
      _id: savedPost._id.toString(),
      createdAt: savedPost.createdAt.toISOString(),
      updatedAt: savedPost.updatedAt.toISOString(),
    };
  },
  getPosts: async function (args, req) {
    if (!req.isAuth) {
      createError("Not Authenticated", 401);
    }
    const numOfPosts = await Post.find().countDocuments();
    const posts = await Post.find().sort({ createdAt: -1 }).populate("creator");
    return {
      posts: posts.map((p) => {
        return {
          ...p._doc,
          _id: p._id.toString(),
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        };
      }),
      totalPosts: numOfPosts,
    };
  },
};
