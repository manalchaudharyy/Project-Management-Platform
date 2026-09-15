require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");

const OLD_ADMIN_EMAIL = "manalch@gmail.com";

const ADMIN = {
  username: "manal",
  email: "manalch4015@gmail.com",
  password: "qwerty123",
};

const run = async () => {
  await connectDB();

  // Delete the old admin account if it exists
  const deleted = await User.deleteOne({ email: OLD_ADMIN_EMAIL });
  if (deleted.deletedCount > 0) {
    console.log("Deleted old admin:", OLD_ADMIN_EMAIL);
  } else {
    console.log("No old admin found with email:", OLD_ADMIN_EMAIL);
  }

  // Delete any existing account with the target email so we can recreate it as admin
  const deletedExisting = await User.deleteOne({ email: ADMIN.email });
  if (deletedExisting.deletedCount > 0) {
    console.log("Deleted existing account:", ADMIN.email);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(ADMIN.password, salt);

  const admin = await User.create({
    username: ADMIN.username,
    email: ADMIN.email,
    password: hashedPassword,
    role: "admin",
    isVerified: true,
  });

  console.log("New admin created:", admin.email);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});