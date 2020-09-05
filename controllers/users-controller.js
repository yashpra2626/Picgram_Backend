const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const User = require("../models/user");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (err) {
    return next(new Error(err.message));
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signUp = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new Error("Invalid user input");
  }
  const { name, email, password } = req.body;

  const imageFile = req.files.userdp;
  const ext = imageFile.name.split(".")[1];
  const filePath = `uploads/${uuidv4()}.${ext}`;

  imageFile.mv(filePath, (err) => {
    console.log("FILE UPLOAD ERROR", err);
  });
  try {
    existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.json({ message: "User already exist" });
    }
  } catch (err) {
    return next(new Error(err.message));
  }

  let hashedPassword;

  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (error) {
    return next(new Error("Could not create a User"));
  }

  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    image: filePath,
    places: [],
  });

  try {
    await newUser.save();
  } catch (err) {
    return next(new Error(err.message));
  }

  let token;
  try {
    token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (error) {}
  res.json({ userId: newUser.id, email: newUser.email, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  let identifiedUser;
  try {
    identifiedUser = await User.findOne({ email: email });
  } catch (err) {
    return next(new Error(err.message));
  }
  if (!identifiedUser) {
    return next(new Error("Invalid Credentials"));
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, identifiedUser.password);
  } catch (error) {}

  if (isValidPassword) {
    let token;
    try {
      token = jwt.sign(
        { userId: identifiedUser.id, email: identifiedUser.email },
        process.env.JWT_KEY,
        { expiresIn: "1h" }
      );
    } catch (error) {}

    res.json({
      userId: identifiedUser.id,
      email: identifiedUser.email,
      token: token,
    });
  } else {
    return next(new Error("Invalid Password"));
  }
};

exports.getUsers = getUsers;
exports.signUp = signUp;
exports.login = login;
