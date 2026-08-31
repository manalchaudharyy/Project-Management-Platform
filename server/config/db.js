const mongoose = require("mongoose");
const util = require("util");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed - FULL ERROR:");
    console.error(util.inspect(error, { depth: null, colors: true }));
    // process.exit(1);  
  }
};

module.exports = connectDB;