// One-time migration: run this ONCE, before deploying the email-verification
// feature, so that accounts created before this change don't get locked out
// (they'd otherwise default to isVerified: false and be unable to log in).
//
// Usage:
//   node server/migrateVerifyExisting.js
require("dotenv").config();
const connectDB = require("./config/db");
const User = require("./models/User");

const run = async () => {
  await connectDB();

  const result = await User.updateMany(
    { isVerified: { $ne: true } },
    { $set: { isVerified: true } }
  );

  console.log(`Marked ${result.modifiedCount} existing user(s) as verified.`);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});