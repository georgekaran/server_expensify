const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const authConfig = require("../../config/auth");

const jwt_name = "expensify_session";

function generateToken(params = {}) {
  return jwt.sign(params, authConfig.secret, {
    expiresIn: 86400
  });
}

function comparePassword(password, userPassword) {
  return bcrypt.compare(password, userPassword);
}

function generateResetToken() {
  return crypto.randomBytes(20).toString("hex");
}

function generateImageToken() {
  return crypto.randomBytes(25).toString("hex");
}

module.exports = {
  jwt_name,
  generateToken,
  comparePassword,
  generateResetToken,
  generateImageToken
};
