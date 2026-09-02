//NoSQL document based-json 
const mongoose = require("mongoose"); // ODM object document mapper (js-mongodb)
const util = require("util"); // to print error completely

const connectDB = async () => { //async: wait until that specific work is done
  try { //if error go to catch don't crash
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed - FULL ERROR:");
    console.error(util.inspect(error, { depth: null, colors: true }));
    // process.exit(1);  server will shutdown in case of error (1)
  }
};

module.exports = connectDB; //available to be used by other files