const express = require("express");
const bodyParser = require("body-parser");
const route = require("./route/route");
const mongoose = require("mongoose");
const multer = require("multer");
// const cors = require('cors');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer().any());
// app.use(cors());

const url =
  "mongodb+srv://harsh-developer:aA12345678@cluster0.lxbes.mongodb.net/group22Database?retryWrites=true&w=majority";
mongoose
  .connect(url, { useNewUrlParser: true })
  .then(() => console.log("mongoDb is connected"))
  .catch((error) => console.log(error));

app.use("/", route);

app.listen(process.env.PORT || 3001, () => {
  console.log("Express app running on port " + (process.env.PORT || 3001));
});
