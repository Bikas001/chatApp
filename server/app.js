const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");

mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    logger.info("connected to mongodb");
  })
  .catch((error) => {
    logger.error("error connection to mongodb", error.message);
  });

app.use(middleware.requestLogger);
app.use(express.json());
app.use(express.static("build"));
app.use(express.static("public"));

// app.use(express.static(__dirname+'/public'));

app.use(cors());

app.use(middleware.unknownEndpoint);

module.exports = app;
