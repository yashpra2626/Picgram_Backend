const { validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const Place = require("../models/place");
const User = require("../models/user");
const mongoose = require("mongoose");
const fs=require('fs');

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new Error(err.message);
    return next(error);
  }
  if (!place) {
    return next(new Error("Place does not exist for given Id"));
  }
  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let places;
  let user;
  try {
    user = await User.findById(userId).populate("places");
    places = user.places;
  } catch (err) {
    const error = new Error(err.message);
    return next(error);
  }
  if (!places) {
    return next(new Error("Place does not exist with given userId"));
  }
  res.json({
    places: places.map((place) => place.toObject({ getters: true })),
  });
};

const createPlace = async (req, res, next) => {
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new Error("Invalid user input"));
  }
  const { title, description, address } = req.body;

  const imageFile = req.files.image;
  const ext = imageFile.name.split(".")[1];
  const filePath = `uploads/${uuidv4()}.${ext}`;
  imageFile.mv(filePath, (err) => {
     if(err){
    console.log("FILE UPLOAD ERROR", err);
    //next(new Error(err));
     }
     else{
       console.log("Success");
     }
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
    if (!user) {
      return next(new Error("User does not exist for given Id"));
    }
  } catch (err) {
    return next(new Error(err));
  }

  const newPlace = new Place({
    title,
    description,
    address,
    creatorId: req.userData.userId,
    image: filePath,
  });
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    await newPlace.save({ session: sess });
    user.places.push(newPlace);
    await user.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    const error = new Error(err.message);
    return next(error);
  }
  res.json(newPlace);
};

const updatePlaceById = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new Error("Invalid user input");
  }
  const placeId = req.params.pid;
  const { title, description } = req.body;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    return next(new Error(err.message));
  }
  if (!place) {
    return next(new Error("Requested place does not exist"));
  }

  if (place.creatorId.toString() !== req.userData.userId) {
    return next(new Error("Not Authorized to Update"));
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (error) {
    return next(new Error(error.message));
  }
  res.json({ place: place.toObject({ getters: true }) });
};

const deletePlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place; 

  try {
    place = await Place.findById(placeId).populate("creatorId");
    //places = user.places;
  } catch (err) {
    return next(new Error(err.message));
  }

  if (!place) {
    return res.json({ message: "Place does not exist" });
  }
  if (place.creatorId.id !== req.userData.userId) {
    return next(new Error("Not Authorized to Delete"));
  }

  const imagePath = place.image;
  const user = place.creatorId;
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    await place.remove({ session: sess });
    user.places.pull(place);
    await user.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    return next(new Error(err.message));
  }

  fs.unlink(imagePath, (err) => {
    if(err){
    console.log(err);
    }
    else{
      console.log("Success");
    }
  });
  res.json({ message: "Successfully delete the place" });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlaceById = updatePlaceById;
exports.deletePlaceById = deletePlaceById;
