const express = require("express");
const security = require("../utils/security");
const mailer = require("../../modules/mailer");
const authMiddleware = require('../middlewares/auth')
const jwt = require('jsonwebtoken')
const authConfig = require('../../config/auth.json')

const User = require("../models/user");
const router = express.Router();

function setCookieSession(res, token) {
  try {
    if (res && token) {
      console.log(security.jwt_name, token)
      res.cookie(security.jwt_name, token, { httpOnly: true });
    }
  } catch (err) {
    console.log(err);
  }
}

router.post("/register", async (req, res) => {
  const { email } = req.body;
  try {
    console.log(email)
    const emailExist = await User.findOne({ email });
    console.log(emailExist)
    if (emailExist) {
      return res.status(400).send({ error: "User already exists" });
    }

    const user = await User.create(req.body);
    const token = security.generateToken({ id: user._id });

    user.password = undefined;

    setCookieSession(res, token);

    return res.send({ user, token });
  } catch (err) {
    return res.status(400).send({ error: "Registration failed" });
  }
});

router.post("/authenticate", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res.status(400).send({ error: "User not found" });
  }

  if (!(await security.comparePassword(password, user.password))) {
    return res.status(400).send({ error: "Invalid password" });
  }

  const token = security.generateToken({ id: user._id });

  req.session.token = token;

  //res.header('Authorization', 'Bearer '+ token);

  user.password = undefined;

  setCookieSession(res, token);

  //console.log(res)
  res.send({ user, token });
});

router.get("/isAuthenticated", authMiddleware, async (req, res) => {
  try {
    res.send({ isAuthenticated: true });
  } catch (err) {
    res.send({ isAuthenticated: false });
  }

});

router.post("/is_token_valid", async (req, res) => {
  try {
    const { token } = req.body
    console.log(req.body)
    jwt.verify(token, authConfig.secret, (err, decoded) => {
      if (err) return res.status(401).send({ isTokenValid: false })

      req.userId = decoded.id
      res.send({ isTokenValid: true });
    })
  } catch (err) {
    res.send({ isTokenValid: false });
  }
});

router.post("/forgot_password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send({ error: "User not found" });
    }

    const token = security.generateResetToken();

    const now = new Date();
    now.setHours(now.getHours() + 1);

    await User.findByIdAndUpdate(user._id, {
      $set: {
        passwordResetToken: token,
        passwordResetExpires: now
      }
    });

    mailer.sendMail(
      {
        to: email,
        from: "georgekaran@gmail.com",
        template: "auth/forgot_password",
        context: { token }
      },
      err => {
        if (err) {
          return res
            .status(400)
            .send({ error: "Cannot send forgot password email" });
        }
        return res.send();
      }
    );
  } catch (err) {
    console.log(err);
    return res
      .status(400)
      .send({ error: "User on forgot password, try again" });
  }
});

router.post("/reset_password", async (req, res) => {
  const { email, token, password } = req.body;

  try {
    const user = await User.findOne({ email }).select(
      "+passwordResetToken passwordResetExpires"
    );
    if (!user) {
      return res.status(400).send({ error: "User not found" });
    }

    if (token !== user.passwordResetToken) {
      return res.status(400).send({ error: "Token invalid" });
    }

    const now = new Date();

    if (now > user.passwordResetExpires) {
      return res
        .status(400)
        .send({ error: "Token expired, generate a new one" });
    }

    user.password = password;

    await user.save();

    res.send();
  } catch (err) {
    return res.status(400).send({ error: "Cannot reset password try again" });
  }
});

module.exports = app => app.use("/auth", router);
