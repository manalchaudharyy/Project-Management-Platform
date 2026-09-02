require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");

const ADMIN = {
  username: "admin",
  email: "admin@example.com", // change this
  password: "ChangeMe123",     // change this, must be 6+ chars
};

const run = async () => {
  await connectDB();

  const existing = await User.findOne({ email: ADMIN.email });
  if (existing) {
    console.log("A user with this email already exists:", existing.email, "role:", existing.role);
    process.exit(0);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(ADMIN.password, salt);

  const admin = await User.create({
    username: ADMIN.username,
    email: ADMIN.email,
    password: hashedPassword,
    role: "admin",
  });

  console.log("Admin created:", admin.email);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});