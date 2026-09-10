const mongoose = require("mongoose");

// Checks that req.params[paramName] is a valid Mongo ObjectId *before* it
// reaches the controller. Without this, an invalid id (bad format, wrong
// length, garbage string) makes Mongoose throw a CastError deep inside a
// query — controllers were catching that as a generic 500 "Server error"
// instead of a clean 400. Use it on any route with an :id / :taskId param.
const validateObjectId = (paramName = "id") => {
  return (req, res, next) => {
    const value = req.params[paramName];

    if (!mongoose.Types.ObjectId.isValid(value)) {
      return res.status(400).json({
        message: `Invalid ${paramName}: "${value}" is not a valid id`,
      });
    }

    next();
  };
};

module.exports = validateObjectId;