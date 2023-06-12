const weatherRoute = require("express").Router;
const axios = require("axios");
const { redis } = require("../db/redis");
const { winstonLogger } = require("../middleware/winston");
const rateLimit = require("express-rate-limit");
const limitor = new rateLimit({
  windowsMS: 60 * 1000,
  max: 3,
  handler: (req, res) => {
    res.status(200).send({ error: "too many request" });
  },
});
weatherRoute.get("/:city", limitor, async (req, res) => {
  try {
    const { city } = req.params;
    const existData = await redis.get(`${city}`);
    if (existData) {
      return res.send({ data: JSON.parse(existData) });
    }
    const { data } = await axios.get(
      `https://api.openweathermap.org/data/3.0/weather?q=${city}`
    );
    await redis.set(`${city}`, JSON.stringify(data), "EX", 60 * 60 * 3);
    res.send({ data });
  } catch (error) {
    winstonLogger.error(error.message);
    res.status(500).send({ msg: error.message });
  }
});

module.exports = { weatherRoute };
