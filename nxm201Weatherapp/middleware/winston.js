const winston = require("winston");
const { MongoDB } = require("winston-mongodb");
const winstonLogger = async (req, res, next) => {
  winston.createLogger({
    transports: [
      new winston.transports.Console(),
      new winston.transports.MongoDB({
        db: process.env.Mongo_DB_URl,
        options: { useUnifieldTopology: true },
        collection: "errors",
        level: "error",
      }),
    ],
  });
};
module.exports = { winstonLogger };
