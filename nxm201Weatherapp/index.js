const express = require("express");
const { connection } = require("./db/mongodb");
require("dotenv").config();
const { userRoute } = require("./routes/user.route");
const { weatherRoute } = require("./routes/weather.route");
const { authenticate } = require("./middleware/auth");
const { validator } = require("./middleware/validator");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 8080;
app.use(express.json());
app.use(cookieParser);
app.use("/user", userRoute);
app.use(authenticate);
app.use("/weather", validator, weatherRoute);
app.listen(port, async () => {
  try {
    await connection;
    console.log("port 8080");
  } catch (error) {
    console.log(error.message);
  }
});
