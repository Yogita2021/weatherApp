const mongoose = require("mongoose");
require("dotenv").config();
const connection = mongoose.connect(process.env.Mongo_DB_URl);
module.exports = { connection };
