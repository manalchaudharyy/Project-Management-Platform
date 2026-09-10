const mongoose = require("mongoose");

// Stores the unique id (jti) of any JWT that's been explicitly logged out
// before its natural expiry. protect() checks this on every request.
//
// `expiresAt` is set to the token's own expiry time, and the TTL index below
// tells MongoDB to auto-delete the document once that time passes — so this
// collection never grows unbounded and needs no manual cleanup job.
const blacklistedTokenSchema = new mongoose.Schema({
  jti: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

// expireAfterSeconds: 0 means "delete exactly at the time stored in expiresAt"
blacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("BlacklistedToken", blacklistedTokenSchema);