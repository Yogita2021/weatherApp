const redis = require("../db/redis");
const jwt = require("jsonwebtoken");

const { winstonLogger } = require("./winston");

const authenticate = async (req, res, next) => {
  try {
    const tokenKey = req.cookies.access_token_key;
    const accessToken = await redis.get(tokenKey);
    const isTokenValid = jwt.verify(
      accessToken,
      process.env.JWT_Access_Token_Secrete_key
    );
    if (isTokenValid) {
      return res.status(400).send({ message: "JWT Expired" });
    }
    res.payload = isTokenValid;
    next();
  } catch (error) {
    winstonLogger.error(error.message);
    res.status(400).send({ message: "Auth error" });
  }
};

module.exports = { authenticate };
