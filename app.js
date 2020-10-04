const express = require("express");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const path = require("path");
const mongoose = require("mongoose");
const placesRoute = require("./routes/places-routes");
const usersRoute = require("./routes/users-routes");
const app = express();
app.use(bodyParser.json());
app.use(fileUpload());
app.use("/uploads", express.static(path.join("uploads")));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin,X_Requested_With,Content-Type,Accept,Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "PATCH,POST,GET,DELETE");
  next();
});

app.use("/api/places", placesRoute);
app.use("/api/users", usersRoute);

const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0cdng.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
mongoose
  .connect(url)
  .then(() => {
    app.listen(process.env.PORT || 5000);
    console.log("Connection Success");
  })
  .catch((err) => {
    console.log("Mongoose Database Error", err);
  });
