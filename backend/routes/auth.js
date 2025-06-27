const express = require("express");

const router = express.Router();

const { body } = require("express-validator");

const User = require("../models/user");

const authController = require("../controller/auth");
//PUT auth/signup --> signup a new user
router.put(
  "/signup",
  [
    body("name").trim().not().isEmpty(),
    body("email")
      .isEmail()
      .withMessage("Please Enter a valid email")
      .custom(async (value, { req }) => {
        try {
          const user = await User.find({ email: value });
          if (user) {
            return new Promise.reject("Email already exist");
          }
        } catch (err) {
          console.log(err);
        }
      })
      .normalizeEmail(),
    body("password").trim().isLength({ min: 5 }),
  ],
  authController.signup
);

//POST auth/login --> login an user
router.post(
  "/login",
  [
    body("email").trim().isEmail(),
    body("password").trim().isLength({ min: 5 }),
  ],
  authController.login
);

module.exports = router;
