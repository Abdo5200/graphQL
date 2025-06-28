const User = require("../models/user");
const Post = require("../models/post");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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
      const error = new Error("Invalid Input from the resolver");
      error.data = errors;
      error.code = 422;
      throw error;
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
      const error = new Error("Invalid Input");
      error.data = errors;
      error.code = 422;
      throw error;
    }
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("User is not found");
      error.code = 401;
      throw error;
    }
    const checkPassword = bcrypt.compare(password, user.password);
    if (!checkPassword) {
      const error = new Error("Password is invalid");
      error.code = 422;
      throw error;
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
      const error = new Error("Invalid input data");
      error.code = 422;
      error.data = errors;
      throw error;
    }
    // const user = await User.findById(req.userId);
    const post = new Post({
      title: postData.title,
      content: postData.content,
      imageUrl: postData.imageUrl,
    });
    // user.posts.push(post._id);
    const savedPost = await post.save();
    return {
      ...savedPost._odc,
      _id: savedPost._id.toString(),
      createdAt: savedPost.createdAt.toISOString(),
      updatedAt: savedPost.updatedAt.toISOString(),
    };
  },
};
