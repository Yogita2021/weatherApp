const validator = async (req, res, next) => {
  const { city } = req.query;
  const regex = /^[A-Za\s-]+$/;
  if (regex.test(city)) {
    next();
  } else {
    res.status(400).send({ message: "Invalid City" });
  }
};
module.exports = { validator };
