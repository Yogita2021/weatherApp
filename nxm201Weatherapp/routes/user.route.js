const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../model/user.model");
const { redis } = require("../db/redis");
const { winstonLogger } = require("../middleware/winston");
const userRoute = require("express").Router;

userRoute.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const isUserPresent = await User.findOne({ email });
    if (isUserPresent) {
      return res.status(400).send({ msg: "alredy present" });
    }
    const hashedpassword = bcrypt.hashSync(password, 8);
    const newuser = new User({ ...req.body, password: hashedpassword });
    await newuser.save();
    res.status(200).send({ msg: "registered succesfully!!" });
  } catch (error) {
    winstonLogger.error(error.message);
    res.status(500).send({ msg: error.message });
  }
});
userRoute.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const isUserPresent = await User.findOne({ email });
    if (!isUserPresent) {
      return res.status(400).send({ msg: "please signup" });
    }

    const isPasswordCorrect = bcrypt.compareSync(
      password,
      isUserPresent.password
    );
    if (!isPasswordCorrect) {
      return res.status(400).send({ msg: "incorrect password" });
    }
    const acessToken = jwt.sign(
      { userId: isUserPresent._id },
      process.env.JWT_Access_Token_Secrete_key,
      { expiresIn: process.env.Jwt_Access_token_expiry }
    );

    const refreshToken = jwt.sign(
      { userId: isUserPresent._id },
      process.env.Jwt_refresh_token_secreteKey,
      { expiresIn: process.env.Jwt_refresh_token_expiry }
    );
    await redis.set(isUserPresent._id + "_access_token", acessToken, "EX", 60);
    await redis.set(
      isUserPresent._id + "_refresh_token",
      refreshToken,
      "EX",
      60 * 3
    );
    res.cookie("access_token-key", isUserPresent._id + "_access_token");
    res.cookie("refresh_token-key", isUserPresent._id + "_refresh_token");
    res.status(200).send({ msg: "login successfull!!" });
  } catch (error) {
    winstonLogger.error(error.message);
    res.status(500).send({ msg: error.message });
  }
});
userRoute.get("/logout", async (req, res) => {
  try {
    const tokenKey = req.cookies.acess_token_key;
    const refreshKey = req.cookies.refresh_token_key;

    const accessToken = await redis.get(tokenKey);
    const refreshToken = await redis.get(refreshKey);
    await redis.set(accessToken, accessToken, "EX", 60 * 10);
    await redis.set(refreshToken, refreshToken, "EX", 60 * 10);
    await redis.del(tokenKey);
    await redis.del(refreshKey);
    res.send(200).send({ msg: "logout successful" });
  } catch (error) {
    winstonLogger.error(error.message);
    res.status(500).send({ msg: error.message });
  }
});
userRoute.get("/refresh-token", async (req, res) => {
  try {
    const tokenKey = req.cookies.refresh_token_key;
    const refreshToken = await redis.get(tokenKey);
    if (!tokenKey) {
      res.status(400).send({ msg: "unauthorized user" });
    }
    const isTokenValid = await jwt.verify(
      refreshToken,
      process.env.Jwt_refresh_token_secreteKey
    );
    if (!isTokenValid) {
      res.status(400).send({ msg: "unauthorized user" });
    }
    const accessToken = jwt.sign(
      { userId: isTokenValid.userId },
      process.env.JWT_Access_Token_Secrete_key,
      { expiresIn: process.env.Jwt_Access_token_expiry }
    );

    await redis.set(
      isTokenValid.userId + "_access_token",
      accessToken,
      "EX",
      60
    );
    res.cookie("access_token_key", isTokenValid.userId + "_access_token");
    res.status(200).send({ msg: "Token generated" });
  } catch (error) {
    winstonLogger.error(error.message);
    res.status(500).send({ msg: error.message });
  }
});
module.exports = { userRoute };
